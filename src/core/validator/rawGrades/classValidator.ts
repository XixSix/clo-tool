/**
 * Validate các chỉ tiêu ở mức toàn lớp của file điểm thô.
 */

import type { CourseConfig, RawGradesFile, ValidationIssue } from '../../types'

export function validateRawClass(
  config: CourseConfig,
  file: RawGradesFile
): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  if (file.students.length < config.quyTac.nguong_co_mau_n) {
    issues.push({
      level: 'warning',
      message: `Quy mô lớp N = ${file.students.length} < ${config.quyTac.nguong_co_mau_n}: các chỉ số p, d, α kém tin cậy.`
    })
  }

  if (file.attendanceSessions.length === 0) {
    issues.push({
      level: 'warning',
      message: 'File điểm thô không có cột điểm danh (Buổi 1..N). Điểm CC phải nhập tay.'
    })
  }

  return issues
}
