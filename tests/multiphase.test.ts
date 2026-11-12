import { describe, expect, it } from 'vitest'
import type { CourseConfig, RawGrades, RawStudentRow } from '@core/types'
import {
  applyAttendance,
  calculateAllExamPsychometrics,
  calculateEvaluation,
  finalConfig,
  mergeRawGrades,
  processConfig,
  roundHalfUp
} from '@core/index'
import { scoreColumnsFromConfig } from '@core/utils/scoreColumns'
import { buildMockClass, buildMockConfig, MOCK_SESSION_LABELS } from './fixtures/mockClass'
import { buildMockMultiDeConfig, buildMockMultiDeStudents } from './fixtures/mockMultiDe'

const META: RawGrades['meta'] = {
  tenHocPhan: 'Kỹ thuật lập trình',
  maHp: 'KTLT101',
  lop: '1A11_CNTT14',
  hocKy: 'HK1',
  namHoc: '2026-2027'
}

function wrapStudents(students: RawStudentRow[]): RawGrades {
  return {
    meta: META,
    students,
    attendance: [],
    attendanceSessions: [],
    declaredMaxScores: {},
    studentExcelRows: students.map((_, index) => index + 2)
  }
}

function pickColumns(row: RawStudentRow, columns: string[]): RawStudentRow {
  return {
    student: { ...row.student },
    scores: {
      maDe: row.scores.maDe,
      diemCacCot: Object.fromEntries(
        Object.entries(row.scores.diemCacCot).filter(([code]) => columns.includes(code))
      ),
      ghiChu: row.scores.ghiChu
    }
  }
}

interface SplitData {
  baseline: RawGrades
  process: RawGrades
  final: RawGrades
}

/** Tách lớp mock thành 1 file đầy đủ (baseline), 1 file quá trình và 1 file cuối kỳ. */
function splitClass(config: CourseConfig, count = 10): SplitData {
  const { students, attendance } = buildMockClass(count)
  const processColumns = scoreColumnsFromConfig(processConfig(config))
  const ckColumns = scoreColumnsFromConfig(finalConfig(config))

  const attendanceRows = Object.entries(attendance).map(([maSv, symbols]) => ({ maSv, symbols }))
  const sessions = MOCK_SESSION_LABELS.map((label) => ({ column: label, label }))

  const baseline = applyAttendance(
    {
      ...wrapStudents(students),
      attendance: attendanceRows,
      attendanceSessions: sessions
    },
    config
  ).file

  const process = applyAttendance(
    {
      ...wrapStudents(students.map((row) => pickColumns(row, processColumns))),
      attendance: attendanceRows,
      attendanceSessions: sessions
    },
    config
  ).file

  const final = wrapStudents(students.map((row) => pickColumns(row, ckColumns)))

  return { baseline, process, final }
}

describe('Hai giai đoạn: quá trình → cuối kỳ', () => {
  const config = buildMockConfig()
  const { baseline, process, final } = splitClass(config)
  // File cuối kỳ thật ghi mã đề CK (D3); mã đề này chỉ được áp cho đầu điểm CK,
  // không được lọc mất câu GKT/D1 và GTX/D2 của giai đoạn quá trình.
  final.students.forEach((row) => {
    row.scores.maDe = 'D3'
  })

  const baselineResult = calculateEvaluation(config, baseline.students)
  const merged = mergeRawGrades(process, final, config)
  const mergedResult = calculateEvaluation(config, merged.file.students)
  const processResult = calculateEvaluation(processConfig(config), process.students)

  it('merge không có lỗi và đủ sinh viên', () => {
    expect(merged.issues.filter((issue) => issue.level === 'error')).toHaveLength(0)
    expect(mergedResult.students).toHaveLength(baselineResult.students.length)
  })

  it('mã đề CK gắn theo đầu điểm CK, không đè mã đề chung của quá trình', () => {
    merged.file.students.forEach((row) => {
      expect(row.scores.maDeTheoDauDiem?.CK).toBe('D3')
      expect(row.scores.maDe).toBe('ALL')
    })
    expect(mergedResult.students[0].cellScores['GKT_CLO2'].score).toBeGreaterThan(0)
    expect(mergedResult.students[0].cellScores['GTX_CLO2'].score).toBeGreaterThan(0)
  })

  it('kết quả cuối kỳ sau merge bằng kết quả chạy 1 file', () => {
    mergedResult.students.forEach((student, index) => {
      const expected = baselineResult.students[index]
      expect(student.maSv).toBe(expected.maSv)
      expect(student.cloScores).toEqual(expected.cloScores)
      expect(student.ploScores).toEqual(expected.ploScores)
      expect(student.tbcClo).toBe(expected.tbcClo)
      expect(student.courseScore).toBe(expected.courseScore)
      expect(student.courseScoreQd450).toBe(expected.courseScoreQd450)
      expect(student.courseScoreRawPoints).toBe(expected.courseScoreRawPoints)
      expect(student.groupScores).toEqual(expected.groupScores)
      expect(student.isAbsentFinal).toBe(expected.isAbsentFinal)
      expect(student.hasMissingData).toBe(expected.hasMissingData)
    })
    expect(mergedResult.summary).toEqual(baselineResult.summary)
  })

  it('psychometrics sau merge bằng kết quả chạy 1 file', () => {
    const baselineExams = calculateAllExamPsychometrics(config, baseline.students)
    const mergedExams = calculateAllExamPsychometrics(config, merged.file.students)
    expect(
      mergedExams.map((exam) => [exam.maDauDiem, exam.maDe, exam.soSinhVien, exam.cronbachAlpha])
    ).toEqual(
      baselineExams.map((exam) => [exam.maDauDiem, exam.maDe, exam.soSinhVien, exam.cronbachAlpha])
    )
  })

  it('báo cáo quá trình tính đúng CLO nhóm CC + GK', () => {
    processResult.students.forEach((student, index) => {
      const expected = baselineResult.students[index]
      // CLO chưa có đầu điểm ở giai đoạn quá trình (CLO5 chỉ thi CK) tính 0
      for (const [clo, score] of Object.entries(expected.processCloScores)) {
        expect(student.cloScores[clo]).toBe(score)
      }
      expect(student.cloScores.CLO5).toBe(0)
      expect(student.groupScores.CC).toEqual(expected.groupScores.CC)
      expect(student.groupScores.GK).toEqual(expected.groupScores.GK)
    })
  })

  it('VT ở CK vẫn giữ isAbsentFinal sau merge', () => {
    const student = mergedResult.students[4]
    expect(student.isAbsentFinal).toBe(true)
    expect(student.finalCloScores.CLO2).toBe(0)
    expect(merged.file.students[4].scores.diemCacCot.CK_C2).toBe('VT')
  })

  it('mã đề theo đầu điểm được ưu tiên hơn mã đề chung', () => {
    const config = buildMockMultiDeConfig()
    const [svA] = buildMockMultiDeStudents()
    // SV A làm đề GK/D1; mã đề chung D2 chỉ là mã đề của đề khác
    const row: RawStudentRow = {
      student: svA.student,
      scores: { ...svA.scores, maDe: 'D2', maDeTheoDauDiem: { GK: 'D1' } }
    }

    const result = calculateEvaluation(config, [row])
    expect(result.students[0].cellScores['GK_CLO1'].score).toBe(8)
    expect(result.students[0].cellScores['GK_CLO2'].score).toBe(6)
  })

  it('SV thiếu CK: tính 0 nhưng vẫn giữ trọng số CK trong mẫu số', () => {
    const { process: p3, final: f3 } = splitClass(config, 3)
    // SV thứ 3 không nộp câu CK_C1 — các cột CK còn lại vẫn có điểm
    delete f3.students[2].scores.diemCacCot.CK_C1

    const mergedMissing = mergeRawGrades(p3, f3, config)
    const result = calculateEvaluation(config, mergedMissing.file.students)
    const student = result.students[2]

    expect(student.isAbsentFinal).toBe(false)
    expect(student.hasMissingData).toBe(true)
    // CK–CLO2 chỉ có 1 câu duy nhất: trống → 0 điểm
    expect(student.cellScores['CK_CLO2'].score).toBe(0)

    const expectedClo2 = roundHalfUp(
      (6 * student.cellScores['GKT_CLO2'].score +
        4 * student.cellScores['GTX_CLO2'].score +
        10 * 0) /
        20,
      1
    )
    expect(student.cloScores.CLO2).toBe(expectedClo2)

    // Điểm học phần vẫn cộng CK với trọng số 50%
    const { CC, GK, CK } = student.groupScores
    expect(student.courseScore).toBe(roundHalfUp(0.2 * CC.score + 0.3 * GK.score + 0.5 * CK.score, 1))
  })
})
