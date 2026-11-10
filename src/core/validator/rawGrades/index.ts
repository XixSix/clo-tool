/**
 * Validate file điểm thô (DIEM_COT_DIEM) đối chiếu với cấu hình câu hỏi.
 *
 * Mỗi nhóm rule nằm trong một file riêng, index chỉ gom kết quả:
 * - studentIdentityValidator: Mã SV, họ tên
 * - scoreCellValidator: điểm từng ô
 * - classValidator: ngưỡng cỡ mẫu
 * - attendanceValidator: cột điểm danh
 */

import type { CourseConfig, RawGrades, ValidationIssue } from '../../types'
import { validateAttendance } from './attendanceValidator'
import { validateClassLevel } from './classValidator'
import { buildMaxScoreByColumn, validateScores } from './scoreCellValidator'
import { validateStudentIdentity } from './studentIdentityValidator'

export function validateRawGrades(config: CourseConfig, file: RawGrades): ValidationIssue[] {
  // Khi có quy tắc điểm danh và có cột điểm danh, CC sẽ được tính tự động.
  const autoComputedColumns =
    config.diemDanh && config.diemDanh.length > 0 && file.attendanceSessions.length > 0
      ? new Set(['CC'])
      : new Set<string>()

  return [
    ...validateStudentIdentity(file.students, file.studentExcelRows),
    ...validateScores(
      file.students,
      buildMaxScoreByColumn(config),
      file.studentExcelRows,
      autoComputedColumns
    ),
    ...validateClassLevel(file.students.length, config.quyTac.nguong_co_mau_n),
    ...validateAttendance(file.attendanceSessions)
  ]
}
