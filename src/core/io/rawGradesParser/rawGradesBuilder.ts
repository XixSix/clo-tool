/**
 * Ghép kết quả các bước parse thành RawGrades.
 *
 * Giữ một chỗ duy nhất mô tả shape của file điểm thô sau khi đọc.
 */

import type {
  AttendanceRecord,
  AttendanceSession,
  RawGrades,
  RawGradesMeta,
  RawStudentRow
} from '../../types'

export interface RawGradesParts {
  meta: RawGradesMeta
  students: RawStudentRow[]
  attendance: AttendanceRecord[]
  attendanceSessions: AttendanceSession[]
  declaredMaxScores: Record<string, number>
  studentExcelRows: number[]
}

export function buildRawGrades(parts: RawGradesParts): RawGrades {
  return {
    meta: parts.meta,
    students: parts.students,
    attendance: parts.attendance,
    attendanceSessions: parts.attendanceSessions,
    declaredMaxScores: parts.declaredMaxScores,
    studentExcelRows: parts.studentExcelRows
  }
}
