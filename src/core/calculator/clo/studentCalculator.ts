/**
 * Module điều phối quy trình đánh giá kết quả học tập cho 1 sinh viên.
 */

import { calculateCellScores, type CellCalculationOptions } from './cellScoreCalculator'
import { calculateCloResults, calculateGroupScores, calculateTbcClo } from './cloScoreCalculator'
import { calculateCourseScores } from './courseScoreCalculator'
import { calculatePloResults } from '../plo'
import type {
  Course,
  ScoreIssue,
  Student,
  StudentCourseResult,
  StudentCourseScoreRecord
} from '../../types'

/** Tạo record rỗng cho sinh viên chưa có dữ liệu điểm. */
export function emptyScoreRecord(student: Student, course: Course): StudentCourseScoreRecord {
  return {
    id: `${student.id}_${course.id}`,
    sinhVienId: student.id,
    hocPhanId: course.id,
    diemTheoDotDanhGia: []
  }
}

/**
 * Tính toán đầy đủ tất cả các chỉ số cho 1 sinh viên.
 */
export function evaluateStudent(
  student: Student,
  record: StudentCourseScoreRecord,
  course: Course,
  options: CellCalculationOptions = {}
): StudentCourseResult {
  const { dotResults, issues, hasMissingData, isAbsentFinal } = calculateCellScores(
    course,
    record,
    options
  )

  const cloResults = calculateCloResults(course, dotResults)
  const { tbcClo } = calculateTbcClo(course, cloResults)
  const { groupScores, tbQuaTrinh } = calculateGroupScores(course, dotResults)
  const courseScores = calculateCourseScores(course, dotResults, groupScores, cloResults)
  const plo = calculatePloResults(course, cloResults)

  const canhBao: ScoreIssue[] = [...issues]
  if (courseScores.scoreDifferenceWarning) {
    canhBao.push({
      mucDo: 'warning',
      maLoi: 'SCORE_DIFFERENCE',
      noiDung: courseScores.scoreDifferenceWarning
    })
  }

  return {
    id: record.id,
    sinhVienId: student.id,
    hocPhanId: course.id,
    dotDanhGia: dotResults,
    clo: cloResults,
    plo,
    tbcClo,
    diemQuaTrinh: tbQuaTrinh,
    diemHocPhan: courseScores.courseScore,
    diemHocPhanQd450: courseScores.courseScoreQd450,
    diemHocPhanRawPoints: courseScores.courseScoreRawPoints,
    datHocPhan: courseScores.isPassedHp,
    vangThiCuoiKy: isAbsentFinal,
    thieuDuLieu: hasMissingData,
    canhBao
  }
}
