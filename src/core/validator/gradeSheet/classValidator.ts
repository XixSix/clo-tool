/**
 * Validate các chỉ tiêu ở mức toàn lớp của file điểm thô.
 */

import type { Course, GradeSheetData, ValidationIssue } from '../../types'

export function validateGradeSheetClass(course: Course, file: GradeSheetData): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  if (file.sinhVien.length < course.quyTac.nguongCoMauN) {
    issues.push({
      level: 'warning',
      scope: 'grade_sheet',
      message: `Quy mô lớp N = ${file.sinhVien.length} < ${course.quyTac.nguongCoMauN}: kết quả thống kê kém tin cậy.`
    })
  }

  if (file.buoiDiemDanh.length === 0) {
    issues.push({
      level: 'warning',
      scope: 'grade_sheet',
      message: 'File điểm thô không có cột điểm danh (Buổi 1..N). Điểm CC phải nhập tay.'
    })
  }

  return issues
}
