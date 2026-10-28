/**
 * Validate thông tin định danh của từng sinh viên trong file điểm thô.
 */

import type { StudentInfo, ValidationIssue } from '../../types'

export function validateStudentIdentity(
  student: StudentInfo,
  row: number,
  seenMaSv: Set<string>
): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  if (!student.maSv || student.maSv.startsWith('__MISSING_')) {
    issues.push({ level: 'error', row, column: 'Mã SV', message: 'Thiếu Mã SV.' })
  } else if (seenMaSv.has(student.maSv)) {
    issues.push({
      level: 'error',
      row,
      column: 'Mã SV',
      message: `Mã SV "${student.maSv}" bị trùng.`
    })
  } else {
    seenMaSv.add(student.maSv)
  }

  if (!student.hoTen || student.hoTen.trim() === '') {
    issues.push({ level: 'error', row, column: 'Họ và tên', message: 'Thiếu họ tên.' })
  }

  return issues
}
