/**
 * Validate file điểm thô (NHAP_LIEU) đối chiếu với cấu hình học phần.
 *
 * Tách theo nhóm rule:
 * - studentIdentityValidator: Mã SV, họ tên
 * - scoreCellValidator: điểm từng ô
 * - classValidator: ngưỡng cỡ mẫu, cột điểm danh
 */

import type { Course, GradeSheetData, ValidationIssue } from '../../types'
import { validateGradeSheetClass } from './classValidator'
import { buildMaxScoreByColumn, validateStudentScores } from './scoreCellValidator'
import { validateStudentIdentity } from './studentIdentityValidator'

export function validateGradeSheet(course: Course, file: GradeSheetData): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const maxByColumn = buildMaxScoreByColumn(course)
  const seenMaSv = new Set<string>()

  // Giữ thứ tự issue cũ: từng SV check định danh trước, rồi mới check điểm
  file.sinhVien.forEach((student, index) => {
    const row = file.dongExcelSinhVien?.[index] ?? student.sinhVien.tt ?? index + 1
    issues.push(...validateStudentIdentity(student.sinhVien, row, seenMaSv))
    issues.push(...validateStudentScores(student, row, maxByColumn))
  })

  // Hàng "Điểm tối đa" trong file (nếu có) phải khớp khai báo
  for (const [maCot, declared] of Object.entries(file.diemToiDaKhaiBao)) {
    const expected = maxByColumn.get(maCot)
    if (expected !== undefined && Math.abs(expected - declared) > 0.001) {
      issues.push({
        level: 'warning',
        scope: 'grade_sheet',
        column: maCot,
        message: `Điểm tối đa của cột "${maCot}" trong file (${declared}) khác khai báo (${expected}).`
      })
    }
  }

  issues.push(...validateGradeSheetClass(course, file))

  return issues
}
