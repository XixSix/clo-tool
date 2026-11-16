/**
 * Module tính điểm CLO cho từng đợt đánh giá (cell score) của một sinh viên.
 * Quy chuẩn: QĐ 450/QĐ-ĐHTĐ
 *
 * Đầu vào là model phân cấp `Course` + `StudentCourseScoreRecord`:
 *   đợt đánh giá → (mã đề → câu hỏi) hoặc (điểm trực tiếp CLO) hoặc (điểm danh)
 * Đầu ra là `AssessmentResult` cho từng đợt (đã gồm điểm đợt và điểm từng CLO).
 */

import Decimal from 'decimal.js'
import { roundStep } from '../../rules'
import { DEFAULT_ATTENDANCE_RULES } from '../../rules/defaults'
import type {
  AssessmentAttendanceSession,
  AssessmentCLOScore,
  AssessmentComponent,
  AssessmentResult,
  AttendanceRule,
  Course,
  ScoreIssue,
  ScoreValue,
  StudentAssessmentEntry,
  StudentAttendanceMark,
  StudentCourseScoreRecord,
  StudentQuestionScore
} from '../../types'

export interface CellCalculationContext {
  dotResults: AssessmentResult[]
  issues: ScoreIssue[]
  hasMissingData: boolean
  isAbsentFinal: boolean
}

export interface CellCalculationOptions {
  /** Luật quy đổi ký hiệu điểm danh; mặc định theo QĐ450. */
  attendanceRules?: AttendanceRule[]
}

function findEntry(
  record: StudentCourseScoreRecord,
  dotId: string
): StudentAssessmentEntry | undefined {
  return record.diemTheoDotDanhGia.find((entry) => entry.dotDanhGiaId === dotId)
}

function round(value: number, course: Course): number {
  return roundStep(value, course.quyTac.cheDoLamTron, 1)
}

function weightedMean(values: number[], weights: number[], course: Course): number {
  let sum = new Decimal(0)
  let totalWeight = new Decimal(0)
  values.forEach((value, idx) => {
    const w = new Decimal(weights[idx] ?? 0)
    sum = sum.add(w.mul(value))
    totalWeight = totalWeight.add(w)
  })
  if (totalWeight.lte(0)) return 0
  return round(sum.div(totalWeight).toNumber(), course)
}

/** Điểm một câu: 'VT' hoặc ô trống đều được xử lý riêng theo Quyết định #9. */
function cellScoreFromQuestions(
  questions: { id: string; diemToiDa: number }[],
  scores: StudentQuestionScore[],
  course: Course
): { score: number; hasVT: boolean; hasMissing: boolean } {
  let totalEarned = new Decimal(0)
  let totalMax = new Decimal(0)
  const ratios: number[] = []
  let hasVT = false
  let hasMissing = false

  for (const question of questions) {
    totalMax = totalMax.add(question.diemToiDa)
    const raw = scores.find((s) => s.questionId === question.id)?.diem

    if (raw === 'VT') {
      hasVT = true
      continue
    }
    if (raw === null || raw === undefined) {
      hasMissing = true
      if (question.diemToiDa > 0) ratios.push(0)
      continue
    }
    const value = Number(raw)
    totalEarned = totalEarned.add(value)
    if (question.diemToiDa > 0) {
      ratios.push(new Decimal(value).div(question.diemToiDa).toNumber())
    }
  }

  if (hasVT) return { score: 0, hasVT, hasMissing }

  let rawScore = 0
  if (course.quyTac.cachTinhCloBoPhan === 'mean_of_ratios') {
    if (ratios.length > 0) {
      const sum = ratios.reduce((acc, r) => acc.add(r), new Decimal(0))
      rawScore = sum.div(ratios.length).mul(10).toNumber()
    }
  } else if (totalMax.gt(0)) {
    rawScore = totalEarned.div(totalMax).mul(10).toNumber()
  }

  return { score: round(rawScore, course), hasVT: false, hasMissing }
}

/** Điểm danh: trung bình hệ số các buổi đã diễn ra × 10. */
function attendanceScore(
  marks: StudentAttendanceMark[],
  sessions: AssessmentAttendanceSession[] | undefined,
  rules: AttendanceRule[]
): { score: number; soBuoi: number; soVang: number; invalid: string[] } {
  const ruleMap = new Map(rules.map((r) => [r.kyHieu.trim().toUpperCase(), r.heSo]))
  const sessionOrder = new Map((sessions ?? []).map((s, idx) => [s.id, idx]))
  const sorted = [...marks].sort(
    (a, b) =>
      (sessionOrder.get(a.buoiDiemDanhId) ?? Number.MAX_SAFE_INTEGER) -
      (sessionOrder.get(b.buoiDiemDanhId) ?? Number.MAX_SAFE_INTEGER)
  )

  let heSoSum = 0
  let soBuoi = 0
  let soVang = 0
  const invalid: string[] = []

  for (const mark of sorted) {
    const symbol = (mark.kyHieu ?? '').trim()
    if (symbol === '') continue
    soBuoi++
    const key = symbol.toUpperCase()
    const heSo = ruleMap.get(key)
    if (heSo === undefined) invalid.push(symbol)
    else heSoSum += heSo
    if (key === 'V') soVang++
  }

  return { score: soBuoi > 0 ? (heSoSum / soBuoi) * 10 : 0, soBuoi, soVang, invalid }
}

/**
 * Tính điểm các ô (đợt, CLO) và điểm từng đợt cho một sinh viên.
 */
export function calculateCellScores(
  course: Course,
  record: StudentCourseScoreRecord,
  options: CellCalculationOptions = {}
): CellCalculationContext {
  const attendanceRules = options.attendanceRules ?? DEFAULT_ATTENDANCE_RULES
  const dotResults: AssessmentResult[] = []
  const issues: ScoreIssue[] = []
  let hasMissingData = false
  let isAbsentFinal = false

  const pushZeroCells = (dot: AssessmentComponent): AssessmentCLOScore[] =>
    dot.cloList.map((m) => ({ cloId: m.cloId, diem: 0 }))

  for (const dot of course.dotDanhGia) {
    const entry = findEntry(record, dot.id)

    // Chưa có dữ liệu cho đợt này → cả đợt 0 điểm và cảnh báo thiếu dữ liệu.
    if (!entry) {
      hasMissingData = true
      issues.push({
        mucDo: 'warning',
        maLoi: 'MISSING_ASSESSMENT',
        noiDung: `Chưa nhập điểm cho đợt "${dot.tenDotDanhGia}" (tính 0).`,
        dotDanhGiaId: dot.id
      })
      dotResults.push({
        dotDanhGiaId: dot.id,
        nhom: dot.nhom,
        diem: 0,
        clo: pushZeroCells(dot)
      })
      if (dot.nhom === 'CK') isAbsentFinal = true
      continue
    }

    if (entry.cachNhapDiem !== dot.cachNhapDiem) {
      issues.push({
        mucDo: 'warning',
        maLoi: 'ENTRY_MODE_MISMATCH',
        noiDung: `Dữ liệu nhập của đợt "${dot.tenDotDanhGia}" không khớp cách nhập điểm đã khai báo.`,
        dotDanhGiaId: dot.id
      })
    }

    const cells: AssessmentCLOScore[] = []

    if (entry.cachNhapDiem === 'QUESTION_SCORE') {
      const variant =
        dot.maDeList.find((v) => v.id === entry.deId || v.maDe === entry.deId) ?? dot.maDeList[0]

      const dedupe = (questions: (typeof dot.maDeList)[number]['cauHoi']) => {
        const seen = new Set<string>()
        return questions.filter((q) => {
          if (seen.has(q.id)) return false
          seen.add(q.id)
          return true
        })
      }
      // deId = 'ALL' → sinh viên làm mọi đề: gộp câu của tất cả mã đề.
      const allQuestionsOfDot =
        entry.deId === 'ALL' || entry.deId === ''
          ? dedupe(dot.maDeList.flatMap((v) => v.cauHoi))
          : (variant?.cauHoi ?? [])

      if (allQuestionsOfDot.length === 0) {
        hasMissingData = true
        issues.push({
          mucDo: 'warning',
          maLoi: 'MISSING_EXAM_VARIANT',
          noiDung: `Đợt "${dot.tenDotDanhGia}" chưa khai báo mã đề nào.`,
          dotDanhGiaId: dot.id
        })
        for (const mapping of dot.cloList) cells.push({ cloId: mapping.cloId, diem: 0 })
      } else {
        for (const mapping of dot.cloList) {
          const questions = allQuestionsOfDot.filter((q) => q.cloId === mapping.cloId)
          if (questions.length === 0) {
            cells.push({ cloId: mapping.cloId, diem: 0 })
            continue
          }
          const { score, hasVT, hasMissing } = cellScoreFromQuestions(
            questions,
            entry.diemTheoCau,
            course
          )
          if (hasVT) {
            if (dot.nhom === 'CK') isAbsentFinal = true
            issues.push({
              mucDo: 'warning',
              maLoi: 'ABSENT_FINAL_EXAM',
              noiDung: `Sinh viên vắng thi ở đợt "${dot.tenDotDanhGia}" (tính 0).`,
              dotDanhGiaId: dot.id,
              cloId: mapping.cloId
            })
          } else if (hasMissing) {
            hasMissingData = true
            issues.push({
              mucDo: 'warning',
              maLoi: 'MISSING_QUESTION_SCORE',
              noiDung: `Thiếu dữ liệu ở một số câu của đợt "${dot.tenDotDanhGia}" (câu trống tính 0).`,
              dotDanhGiaId: dot.id,
              cloId: mapping.cloId
            })
          }
          cells.push({ cloId: mapping.cloId, diem: score })
        }
      }
    } else if (entry.cachNhapDiem === 'DIRECT_CLO_SCORE') {
      for (const mapping of dot.cloList) {
        const raw = entry.diemTheoClo.find((c) => c.cloId === mapping.cloId)?.diem
        if (raw === 'VT') {
          if (dot.nhom === 'CK') isAbsentFinal = true
          cells.push({ cloId: mapping.cloId, diem: 0 })
        } else if (raw === null || raw === undefined) {
          hasMissingData = true
          issues.push({
            mucDo: 'warning',
            maLoi: 'MISSING_CLO_SCORE',
            noiDung: `Chưa nhập điểm trực tiếp cho CLO trong đợt "${dot.tenDotDanhGia}" (tính 0).`,
            dotDanhGiaId: dot.id,
            cloId: mapping.cloId
          })
          cells.push({ cloId: mapping.cloId, diem: 0 })
        } else {
          const value = Number(raw)
          cells.push({ cloId: mapping.cloId, diem: round(value, course), diemTho: value })
        }
      }
    } else {
      const sessions = dot.buoiDiemDanh
      const { score, soVang, invalid } = attendanceScore(entry.diemDanh, sessions, attendanceRules)
      if (invalid.length > 0) {
        issues.push({
          mucDo: 'warning',
          maLoi: 'UNKNOWN_ATTENDANCE_SYMBOL',
          noiDung: `Mã điểm danh lạ: ${invalid.join(', ')} (tính hệ số 0).`,
          dotDanhGiaId: dot.id
        })
      }
      void soVang
      const rounded = round(score, course)
      for (const mapping of dot.cloList) {
        cells.push({ cloId: mapping.cloId, diem: rounded, diemTho: score })
      }
    }

    const weights = dot.cloList.map((m) => m.tyLePhanBo)
    const componentScore = weightedMean(
      cells.map((c) => c.diem),
      weights,
      course
    )

    dotResults.push({
      dotDanhGiaId: dot.id,
      nhom: dot.nhom,
      diem: componentScore,
      clo: cells
    })
  }

  return { dotResults, issues, hasMissingData, isAbsentFinal }
}

/** Tiện ích: điểm một ô (đợt, CLO) từ kết quả đợt. */
export function cellScoreOf(result: AssessmentResult, cloId: string): number | undefined {
  return result.clo.find((c) => c.cloId === cloId)?.diem
}

/** Tiện ích: chuẩn hóa giá trị điểm thô. */
export function normalizeScoreValue(value: ScoreValue): ScoreValue {
  return value ?? null
}
