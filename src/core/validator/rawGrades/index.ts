/**
 * Validate file điểm thô (DIEM_COT_DIEM) đối chiếu với cấu hình câu hỏi.
 *
 * Tách theo nhóm rule:
 * - studentIdentityValidator: Mã SV, họ tên
 * - scoreCellValidator: điểm từng ô
 * - classValidator: ngưỡng cỡ mẫu, cột điểm danh
 */

import type { CourseConfig, RawGrades, ValidationIssue } from '../../types'
import { validateRawClass } from './classValidator'
import { buildMaxScoreByColumn, validateStudentScores } from './scoreCellValidator'
import { validateStudentIdentity } from './studentIdentityValidator'

export function validateRawGrades(config: CourseConfig, file: RawGrades): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const maxScoreByColumn = buildMaxScoreByColumn(config)
  const seenMaSv = new Set<string>()

  // Giữ thứ tự issue cũ: từng SV check định danh trước, rồi mới check điểm
  file.students.forEach((student, index) => {
    const row = file.studentExcelRows?.[index] ?? student.student.tt ?? index + 1
    issues.push(...validateStudentIdentity(student.student, row, seenMaSv))
    issues.push(...validateStudentScores(student, row, maxScoreByColumn))
  })

  issues.push(...validateRawClass(config, file))
  return issues
}
