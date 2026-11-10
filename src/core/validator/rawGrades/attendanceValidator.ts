/**
 * Validate phần điểm danh của file điểm thô.
 */

import type { AttendanceSession, ValidationIssue } from '../../types'

export function validateAttendance(
  attendanceSessions: AttendanceSession[] | undefined
): ValidationIssue[] {
  if (!attendanceSessions || attendanceSessions.length === 0) {
    return [
      {
        level: 'warning',
        message: 'File điểm thô không có cột điểm danh (Buổi 1..N). Điểm CC phải nhập tay.'
      }
    ]
  }

  return []
}
