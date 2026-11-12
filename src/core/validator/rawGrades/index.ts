/**
 * Validate file điểm thô (DIEM_COT_DIEM) đối chiếu với cấu hình câu hỏi.
 *
 * Mỗi nhóm rule nằm trong một file riêng, index chỉ gom kết quả:
 * - studentIdentityValidator: Mã SV, họ tên
 * - scoreCellValidator: điểm từng ô
 * - classValidator: ngưỡng cỡ mẫu
 * - attendanceValidator: cột điểm danh (bỏ qua ở giai đoạn cuối kỳ)
 * - maDeValidator: mã đề CK khi học phần nhiều đề
 */

import type { CourseConfig, GradePhase, RawGrades, ValidationIssue } from '../../types'
import { validateAttendance } from './attendanceValidator'
import { validateClassLevel } from './classValidator'
import { validateMaDe } from './maDeValidator'
import { buildMaxScoreByColumn, validateScores } from './scoreCellValidator'
import { validateStudentIdentity } from './studentIdentityValidator'

export interface ValidateRawGradesOptions {
  phase?: GradePhase
  /** Bắt buộc cột Mã đề (học phần có nhiều đề CK) */
  requireMaDe?: boolean
}

export function validateRawGrades(
  config: CourseConfig,
  file: RawGrades,
  options: ValidateRawGradesOptions = {}
): ValidationIssue[] {
  const isFinalPhase = options.phase === 'final'

  // Khi có quy tắc điểm danh và có cột điểm danh, CC sẽ được tính tự động.
  // File cuối kỳ không có cột điểm danh nên CC không còn được tính tự động.
  const autoComputedColumns =
    !isFinalPhase &&
    config.diemDanh &&
    config.diemDanh.length > 0 &&
    file.attendanceSessions.length > 0
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
    ...(isFinalPhase ? [] : validateAttendance(file.attendanceSessions)),
    ...validateMaDe(config, file, { requireMaDe: options.requireMaDe })
  ]
}
