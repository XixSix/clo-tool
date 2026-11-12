/**
 * Đọc file điểm thô của lớp (.xlsx) → RawGrades.
 *
 * Mỗi phần việc nằm trong một module riêng:
 * - metaParser: thông tin lớp
 * - headerParser: dò tiêu đề + cột điểm
 * - attendanceParser: cột điểm danh
 * - maxScoreParser: hàng "Điểm tối đa"
 * - studentParser: dữ liệu sinh viên
 *
 * Orchestrator chỉ mở workbook, chọn sheet và ghép kết quả.
 *
 * Parser chỉ chịu trách nhiệm đọc dữ liệu; lỗi cấu trúc hoặc ô không parse được
 * sẽ ném `RawGradesParseError` thay vì trả về issue cho validator.
 */

import type { CourseConfig, GradePhase, RawGrades } from '../../types'
import { findSheet, readWorkbook } from '../../utils/excel'
import { phaseConfig } from '../phaseConfig'
import { parseAttendanceColumns } from './attendanceParser'
import { RawGradesParseError } from './errors'
import { parseRawGradesHeader } from './headerParser'
import { parseDeclaredMaxScores } from './maxScoreParser'
import { parseRawGradesMeta } from './metaParser'
import { buildRawGrades } from './rawGradesBuilder'
import { parseStudentRows } from './studentParser'

export * from './errors'

export interface ParseRawGradesOptions {
  /** Chỉ đọc các cột điểm thuộc giai đoạn này (quá trình hoặc cuối kỳ) */
  phase?: GradePhase
  /** Bắt buộc cột Mã đề (dùng khi cuối kỳ có nhiều đề) */
  requireMaDe?: boolean
}

export async function parseRawGrades(
  filePath: string,
  config: CourseConfig,
  options: ParseRawGradesOptions = {}
): Promise<RawGrades> {
  const wb = await readWorkbook(filePath)
  const ws = findSheet(wb, 'NHAP_LIEU') ?? findSheet(wb, 'NHAP_LIEU_GV') ?? wb.worksheets[0]

  if (!ws) {
    throw new RawGradesParseError('File điểm thô không có sheet dữ liệu.')
  }

  const effectiveConfig = options.phase ? phaseConfig(config, options.phase) : config
  const { header, scoreColumns } = parseRawGradesHeader(ws, effectiveConfig, {
    requireMaDe: options.requireMaDe
  })

  const meta = parseRawGradesMeta(ws, header.rowNumber)
  const { sessions, columns } = parseAttendanceColumns(header.headers)
  const maxScores = parseDeclaredMaxScores(ws, header.rowNumber, effectiveConfig, header.mapping)

  const rows = parseStudentRows({
    ws,
    mapping: header.mapping,
    scoreColumns,
    firstStudentRow: maxScores.firstStudentRow,
    attendanceColumns: columns
  })

  if (rows.students.length === 0) {
    throw new RawGradesParseError('Không đọc được sinh viên nào.')
  }

  return buildRawGrades({
    meta,
    students: rows.students,
    attendance: rows.attendance,
    attendanceSessions: sessions,
    declaredMaxScores: maxScores.scores,
    studentExcelRows: rows.studentExcelRows
  })
}
