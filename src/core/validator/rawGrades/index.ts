/**
 * Validate file điểm thô (NHAP_LIEU) đối chiếu với cấu hình học phần.
 *
 * Tách theo nhóm rule:
 * - studentIdentityValidator: Mã SV, họ tên
 * - scoreCellValidator: điểm từng ô
 * - classValidator: ngưỡng cỡ mẫu, cột điểm danh
 */

import type { Course, RawGrades, ValidationIssue } from '../../types'
import { validateRawClass } from './classValidator'
import { buildMaxScoreByColumn, validateStudentScores } from './scoreCellValidator'
import { validateStudentIdentity } from './studentIdentityValidator'

export function validateRawGrades(course: Course, file: RawGrades): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const maxByColumn = buildMaxScoreByColumn(course)
  const seenMaSv = new Set<string>()

  // Giữ thứ tự issue cũ: từng SV check định danh trước, rồi mới check điểm
  file.students.forEach((student, index) => {
    const row = file.studentExcelRows?.[index] ?? student.student.tt ?? index + 1
    issues.push(...validateStudentIdentity(student.student, row, seenMaSv))
    issues.push(...validateStudentScores(student, row, maxByColumn))
  })

  // Hàng "Điểm tối đa" trong file (nếu có) phải khớp khai báo
  for (const [maCot, declared] of Object.entries(file.declaredMaxScores)) {
    const expected = maxByColumn.get(maCot)
    if (expected !== undefined && Math.abs(expected - declared) > 0.001) {
      issues.push({
        level: 'warning',
        scope: 'raw_grades',
        column: maCot,
        message: `Điểm tối đa của cột "${maCot}" trong file (${declared}) khác khai báo (${expected}).`
      })
    }
  }

  issues.push(...validateRawClass(course, file))

  return issues
}
