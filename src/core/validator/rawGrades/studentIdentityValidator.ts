/**
 * Validate thông tin định danh của từng sinh viên trong file điểm thô.
 */

import type { RawStudentRow, ValidationIssue } from '../../types'

export function validateStudentIdentity(
  students: RawStudentRow[],
  studentExcelRows: number[] = []
): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const seenMaSv = new Set<string>()

  students.forEach((student, index) => {
    const row = studentExcelRows[index] ?? student.student.tt ?? index + 1
    const info = student.student

    if (!info.maSv || info.maSv.startsWith('__MISSING_')) {
      issues.push({ level: 'error', row, column: 'Mã SV', message: 'Thiếu Mã SV.' })
    } else if (seenMaSv.has(info.maSv)) {
      issues.push({
        level: 'error',
        row,
        column: 'Mã SV',
        message: `Mã SV "${info.maSv}" bị trùng.`
      })
    } else {
      seenMaSv.add(info.maSv)
    }

    if (!info.hoTen || info.hoTen.trim() === '') {
      issues.push({ level: 'error', row, column: 'Họ và tên', message: 'Thiếu họ tên.' })
    }
  })

  return issues
}
