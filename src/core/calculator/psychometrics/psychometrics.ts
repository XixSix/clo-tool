/**
 * Mô-đun Kiểm định Đề thi (Psychometrics)
 * Căn cứ: QĐ 450/QĐ-ĐHTĐ Điều 5
 *
 * Tính toán:
 * 1. Độ khó p của từng câu
 * 2. Độ phân biệt d của từng câu (phân nhóm 27% trên/dưới)
 * 3. Độ tin cậy Cronbach's alpha của đề thi
 * 4. Chỉ số "alpha nếu bỏ câu này"
 * 5. Cảnh báo cỡ mẫu nhỏ N < 30
 */

import Decimal from 'decimal.js'
import {
  classifyDifficulty,
  classifyDiscrimination,
  classifyReliability,
  roundHalfUp
} from '../../rules'
import type {
  Course,
  ExamPsychometrics,
  ExamQuestion,
  ItemPsychometrics,
  Student,
  StudentCourseScoreRecord,
  StudentQuestionScore
} from '../../types'

export interface QuestionAggregated {
  cau: string
  diemToiDa: number
  cloId: string
  cotGoc: string[]
}

/** Dữ liệu điểm theo câu của một sinh viên trong một đề. */
export interface QuestionScoreEntry {
  maSv: string
  deId: string
  diemTheoCau: StudentQuestionScore[]
}

/**
 * Gộp các cột điểm là ý nhỏ (ví dụ Câu 3a, Câu 3b) theo tên câu.
 */
export function aggregateQuestions(questions: ExamQuestion[]): QuestionAggregated[] {
  const map = new Map<string, QuestionAggregated>()

  for (const q of questions) {
    const cauKey = String(q.cau).trim()
    const existing = map.get(cauKey)
    if (existing) {
      existing.diemToiDa = new Decimal(existing.diemToiDa).add(q.diemToiDa).toNumber()
      existing.cotGoc.push(q.id)
    } else {
      map.set(cauKey, {
        cau: cauKey,
        diemToiDa: q.diemToiDa,
        cloId: q.cloId,
        cotGoc: [q.id]
      })
    }
  }

  return Array.from(map.values())
}

/**
 * Trích xuất ma trận điểm sinh viên cho từng câu đã gộp.
 * Loại bỏ các sinh viên vắng thi ('VT') hoặc thiếu dữ liệu.
 */
export function extractValidStudentMatrix(
  entries: QuestionScoreEntry[],
  aggQuestions: QuestionAggregated[]
): {
  validStudents: { maSv: string; scores: number[]; totalScore: number }[]
  absentCount: number
} {
  const validStudents: { maSv: string; scores: number[]; totalScore: number }[] = []
  let absentCount = 0

  for (const entry of entries) {
    let isAbsentOrInvalid = false
    const scores: number[] = []

    for (const q of aggQuestions) {
      let qScore = new Decimal(0)
      for (const col of q.cotGoc) {
        const raw = entry.diemTheoCau.find((s) => s.questionId === col)?.diem
        if (raw === 'VT' || raw === null || raw === undefined) {
          isAbsentOrInvalid = true
          break
        }
        qScore = qScore.add(Number(raw))
      }
      if (isAbsentOrInvalid) break
      scores.push(qScore.toNumber())
    }

    if (isAbsentOrInvalid) {
      absentCount++
    } else {
      const total = scores.reduce((sum, s) => sum.add(s), new Decimal(0)).toNumber()
      validStudents.push({ maSv: entry.maSv, scores, totalScore: total })
    }
  }

  return { validStudents, absentCount }
}

/**
 * Tính phương sai mẫu (chia cho N - 1) theo công thức (*) trong QĐ450.
 */
export function sampleVariance(values: number[]): number {
  const n = values.length
  if (n <= 1) return 0

  const mean = values.reduce((sum, v) => sum.add(v), new Decimal(0)).div(n)
  const sumDiffSq = values.reduce((sum, v) => {
    const diff = new Decimal(v).sub(mean)
    return sum.add(diff.mul(diff))
  }, new Decimal(0))

  return sumDiffSq.div(n - 1).toNumber()
}

/**
 * Tính hệ số Cronbach alpha trực tiếp từ số câu hỏi, tổng phương sai câu và phương sai tổng.
 * Đúng theo công thức (*) trong QĐ450 Điều 5.3:
 * alpha = (n / (n - 1)) * (1 - sum(sigma_i^2) / sigma_c^2)
 */
export function calculateCronbachAlphaFromVariances(
  n: number,
  sumItemVariances: number,
  totalVariance: number
): number {
  if (n <= 1 || totalVariance <= 0) return 0
  const nDec = new Decimal(n)
  const factor = nDec.div(nDec.sub(1))
  const varianceRatio = new Decimal(sumItemVariances).div(totalVariance)
  return factor.mul(new Decimal(1).sub(varianceRatio)).toNumber()
}

/**
 * Tính toán hệ số Cronbach's alpha từ ma trận điểm.
 * matrix: m sinh viên x n câu hỏi
 */
export function calculateCronbachAlpha(matrix: number[][]): {
  alpha: number
  itemVariances: number[]
  sumItemVariances: number
  totalVariance: number
} {
  const m = matrix.length
  if (m <= 1) {
    return { alpha: 0, itemVariances: [], sumItemVariances: 0, totalVariance: 0 }
  }

  const n = matrix[0].length
  if (n <= 1) {
    return {
      alpha: 0,
      itemVariances: [sampleVariance(matrix.map((r) => r[0]))],
      sumItemVariances: 0,
      totalVariance: 0
    }
  }

  const itemVariances: number[] = []
  let sumItemVariancesDec = new Decimal(0)

  for (let j = 0; j < n; j++) {
    const colValues = matrix.map((row) => row[j])
    const v = sampleVariance(colValues)
    itemVariances.push(v)
    sumItemVariancesDec = sumItemVariancesDec.add(v)
  }

  const totalScores = matrix.map((row) =>
    row.reduce((acc, score) => acc.add(score), new Decimal(0)).toNumber()
  )
  const totalVariance = sampleVariance(totalScores)

  if (totalVariance <= 0) {
    return {
      alpha: 0,
      itemVariances,
      sumItemVariances: sumItemVariancesDec.toNumber(),
      totalVariance: 0
    }
  }

  const nDec = new Decimal(n)
  const factor = nDec.div(nDec.sub(1))
  const varianceRatio = sumItemVariancesDec.div(totalVariance)
  const alphaDec = factor.mul(new Decimal(1).sub(varianceRatio))

  return {
    alpha: alphaDec.toNumber(),
    itemVariances,
    sumItemVariances: sumItemVariancesDec.toNumber(),
    totalVariance
  }
}

/**
 * Tính toàn bộ chỉ số psychometrics cho mọi đề thi trong Course.
 *
 * Quy tắc (QĐ450 Điều 5): tính riêng cho từng đợt (GK, CK) và từng mã đề,
 * KHÔNG gộp các đợt với nhau. Bỏ qua nhóm CC (chuyên cần/thái độ).
 */
export function calculateAllExamPsychometrics(
  course: Course,
  students: Student[],
  records: StudentCourseScoreRecord[]
): ExamPsychometrics[] {
  const maSvById = new Map(students.map((s) => [s.id, s.maSv]))
  const recordsOfCourse = records.filter(
    (record) => !record.hocPhanId || record.hocPhanId === course.id
  )
  const results: ExamPsychometrics[] = []

  for (const dot of course.dotDanhGia) {
    if (dot.nhom === 'CC') continue
    if (dot.cachNhapDiem !== 'QUESTION_SCORE') continue

    for (const variant of dot.maDeList) {
      if (variant.cauHoi.length === 0) continue

      const entries: QuestionScoreEntry[] = []
      for (const record of recordsOfCourse) {
        const entry = record.diemTheoDotDanhGia.find((item) => item.dotDanhGiaId === dot.id)
        if (!entry || entry.cachNhapDiem !== 'QUESTION_SCORE') continue
        const deId = entry.deId
        const matches =
          deId === 'ALL' ||
          deId === variant.id ||
          deId === variant.maDe ||
          deId === undefined ||
          deId === ''
        if (!matches) continue

        entries.push({
          maSv: maSvById.get(record.sinhVienId) ?? record.sinhVienId,
          deId,
          diemTheoCau: entry.diemTheoCau
        })
      }

      results.push(
        calculateExamPsychometrics(
          dot.id,
          variant.maDe,
          variant.cauHoi,
          entries,
          course.quyTac.tyLeNhom27,
          course.quyTac.nguongCoMauN
        )
      )
    }
  }

  return results
}

/**
 * Tính toàn bộ chỉ số psychometrics cho một bài thi (một đợt, một mã đề).
 */
export function calculateExamPsychometrics(
  maDauDiem: string,
  maDe: string,
  questions: ExamQuestion[],
  entries: QuestionScoreEntry[],
  tyLeNhom27 = 0.27,
  nguongCoMauN = 30
): ExamPsychometrics {
  const aggQuestions = aggregateQuestions(questions)
  const { validStudents } = extractValidStudentMatrix(entries, aggQuestions)
  const m = validStudents.length
  const n = aggQuestions.length

  if (m === 0 || n === 0) {
    return {
      maDauDiem,
      maDe,
      soSinhVien: 0,
      soCauHoi: n,
      items: [],
      cronbachAlpha: 0,
      mucDoTinCay: 'Không đủ độ tin cậy',
      tongPhuongSaiCau: 0,
      phuongSaiTongDiem: 0,
      canhBaoCoMauN: 'Không có dữ liệu sinh viên hợp lệ để phân tích'
    }
  }

  const matrix = validStudents.map((st) => st.scores)

  const overallAlphaResult = calculateCronbachAlpha(matrix)
  const alphaRounded = roundHalfUp(overallAlphaResult.alpha, 2)
  const mucDoTinCay = classifyReliability(overallAlphaResult.alpha)

  const sortedStudents = [...validStudents].sort((a, b) => {
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore
    }
    return a.maSv.localeCompare(b.maSv)
  })

  const g = Math.max(1, roundHalfUp(new Decimal(m).mul(tyLeNhom27).toNumber(), 0))
  const topGroup = sortedStudents.slice(0, g)
  const bottomGroup = sortedStudents.slice(m - g)

  const items: ItemPsychometrics[] = []

  for (let j = 0; j < n; j++) {
    const q = aggQuestions[j]
    const maxScore = q.diemToiDa
    const maxDec = new Decimal(maxScore)

    const colScores = validStudents.map((st) => st.scores[j])
    const meanCol = colScores
      .reduce((acc, s) => acc.add(s), new Decimal(0))
      .div(m)
      .toNumber()

    const p = maxScore > 0 ? new Decimal(meanCol).div(maxDec).toNumber() : 0
    const pRounded = roundHalfUp(p, 2)
    const mucDoKho = classifyDifficulty(p)

    const topColScores = topGroup.map((st) => st.scores[j])
    const bottomColScores = bottomGroup.map((st) => st.scores[j])

    const topMean = topColScores.reduce((acc, s) => acc.add(s), new Decimal(0)).div(g)
    const bottomMean = bottomColScores.reduce((acc, s) => acc.add(s), new Decimal(0)).div(g)

    const d = maxScore > 0 ? topMean.sub(bottomMean).div(maxDec).toNumber() : 0
    const dRounded = roundHalfUp(d, 2)
    const mucDoPhanBiet = classifyDiscrimination(d)

    let alphaIfDropped = 0
    if (n > 1) {
      const reducedMatrix = validStudents.map((st) => st.scores.filter((_, idx) => idx !== j))
      const reducedResult = calculateCronbachAlpha(reducedMatrix)
      alphaIfDropped = roundHalfUp(reducedResult.alpha, 2)
    }

    const warnings: string[] = []
    if (d < 0) {
      warnings.push('Độ phân biệt d < 0: Câu hỏi có vấn đề, nên loại bỏ')
    }
    if (p < 0.2) {
      warnings.push('Độ khó p < 0.2: Câu hỏi rất khó')
    } else if (p >= 0.8) {
      warnings.push('Độ khó p >= 0.8: Câu hỏi rất dễ')
    }

    items.push({
      cau: q.cau,
      diemToiDa: maxScore,
      diemTrungBinh: roundHalfUp(meanCol, 2),
      doKhoP: pRounded,
      mucDoKho,
      doPhanBietD: dRounded,
      mucDoPhanBiet,
      alphaNeuBoCau: alphaIfDropped,
      canhBao: warnings.length > 0 ? warnings.join('; ') : undefined
    })
  }

  let canhBaoCoMauN: string | undefined
  if (n <= 1) {
    canhBaoCoMauN =
      'Đề chỉ có 1 câu nên không tính được Cronbach α (cần tối thiểu 2 câu). Độ khó p và độ phân biệt d vẫn dùng được.'
  } else if (m < nguongCoMauN || g < 5) {
    canhBaoCoMauN = `Cỡ mẫu N = ${m} < ${nguongCoMauN} (nhóm 27% = ${g} SV): các chỉ số độ phân biệt d và độ tin cậy alpha có thể kém tin cậy.`
  }

  return {
    maDauDiem,
    maDe,
    soSinhVien: m,
    soCauHoi: n,
    items,
    cronbachAlpha: alphaRounded,
    mucDoTinCay,
    tongPhuongSaiCau: roundHalfUp(overallAlphaResult.sumItemVariances, 4),
    phuongSaiTongDiem: roundHalfUp(overallAlphaResult.totalVariance, 4),
    canhBaoCoMauN
  }
}
