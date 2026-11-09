/**
 * Orchestrator điều phối tính điểm CLO, TBC CLO, điểm học phần và PLO.
 * Quy chuẩn: Đại học Thành Đông (QĐ 450/QĐ-ĐHTĐ ngày 07/8/2024)
 */

import { calculateClassSummary } from './classSummaryCalculator'
import { emptyScoreRecord, evaluateStudent } from './studentCalculator'
import type { CellCalculationOptions } from './cellScoreCalculator'
import type {
  Course,
  EvaluationReport,
  Student,
  StudentCourseResult,
  StudentCourseScoreRecord
} from '../../types'

/**
 * Tính toán toàn bộ điểm số học phần, CLO, TBC CLO và PLO cho danh sách sinh viên.
 */
export function calculateEvaluation(
  course: Course,
  students: Student[],
  records: StudentCourseScoreRecord[],
  options: CellCalculationOptions = {}
): EvaluationReport {
  const recordByStudent = new Map<string, StudentCourseScoreRecord>()
  for (const record of records) {
    if (record.hocPhanId && record.hocPhanId !== course.id) continue
    recordByStudent.set(record.sinhVienId, record)
  }

  const results: StudentCourseResult[] = students.map((student) =>
    evaluateStudent(
      student,
      recordByStudent.get(student.id) ?? emptyScoreRecord(student, course),
      course,
      options
    )
  )

  return {
    hocPhanId: course.id,
    sinhVien: results,
    tongHop: calculateClassSummary(course, results)
  }
}
