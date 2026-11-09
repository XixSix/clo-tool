/**
 * Validate các chỉ tiêu ở mức toàn lớp của file điểm thô.
 */

import type { Course, RawGrades, ValidationIssue } from '../../types'

export function validateRawClass(course: Course, file: RawGrades): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  if (file.students.length < course.quyTac.nguongCoMauN) {
    issues.push({
      level: 'warning',
      scope: 'raw_grades',
      message: `Quy mô lớp N = ${file.students.length} < ${course.quyTac.nguongCoMauN}: các chỉ số p, d, α kém tin cậy.`
    })
  }

  if (file.attendanceSessions.length === 0) {
    issues.push({
      level: 'warning',
      scope: 'raw_grades',
      message: 'File điểm thô không có cột điểm danh (Buổi 1..N). Điểm CC phải nhập tay.'
    })
  }

  return issues
}
