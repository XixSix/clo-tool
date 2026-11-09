/**
 * Validate thông tin định danh của từng sinh viên trong file điểm thô.
 */

import type { Student, ValidationIssue } from '../../types'

export function validateStudentIdentity(
  student: Student,
  row: number,
  seenMaSv: Set<string>
): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  if (!student.maSv || student.maSv.startsWith('__MISSING_')) {
    issues.push({ level: 'error', scope: 'raw_grades', row, column: 'Mã SV', message: 'Thiếu Mã SV.' })
  } else if (seenMaSv.has(student.maSv)) {
    issues.push({
      level: 'error',
      scope: 'raw_grades',
      row,
      column: 'Mã SV',
      message: `Mã SV "${student.maSv}" bị trùng.`
    })
  } else {
    seenMaSv.add(student.maSv)
  }

  if (!student.hoTen || student.hoTen.trim() === '') {
    issues.push({
      level: 'error',
      scope: 'raw_grades',
      row,
      column: 'Họ và tên',
      message: 'Thiếu họ tên.'
    })
  }

  return issues
}
