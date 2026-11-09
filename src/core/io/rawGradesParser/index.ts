/**
 * Đọc file điểm thô của lớp (.xlsx) → RawGrades.
 *
 * Mỗi phần việc nằm trong một module riêng:
 * - metaParser: thông tin lớp
 * - headerParser: dò tiêu đề + cột điểm
 * - attendanceParser: cột điểm danh
 * - maxScoreParser: hàng "Điểm tối đa"
 * - studentParser: dữ liệu sinh viên
 * - toStudentRecords: chuyển RawGrades → Student + StudentCourseScoreRecord
 *
 * Parser chỉ chịu trách nhiệm đọc dữ liệu; lỗi cấu trúc hoặc ô không parse được
 * sẽ ném `RawGradesParseError` thay vì trả về issue cho validator.
 */

import type { Course, RawGrades } from '../../types'
import { findSheet, readWorkbook } from '../../utils/excel'
import { parseAttendanceColumns } from './attendanceParser'
import { RawGradesParseError } from './errors'
import { assertScoreColumns, parseRawGradesHeader } from './headerParser'
import { parseDeclaredMaxScores } from './maxScoreParser'
import { parseRawGradesMeta } from './metaParser'
import { parseStudentRows } from './studentParser'

export * from './errors'
export * from './toStudentRecords'

export async function parseRawGrades(filePath: string, course: Course): Promise<RawGrades> {
  const wb = await readWorkbook(filePath)
  const ws = findSheet(wb, 'NHAP_LIEU') ?? findSheet(wb, 'NHAP_LIEU_GV') ?? wb.worksheets[0]

  if (!ws) {
    throw new RawGradesParseError('File điểm thô không có sheet dữ liệu.')
  }

  const parsedHeader = parseRawGradesHeader(ws, course)
  if (!parsedHeader) {
    throw new RawGradesParseError(
      'Không tìm thấy hàng tiêu đề (cần có cột "Mã SV", "Họ", "Tên"...).'
    )
  }

  const { header, scoreColumns } = parsedHeader
  assertScoreColumns(header, scoreColumns)

  const meta = parseRawGradesMeta(ws, header.rowNumber)
  const { sessions, columns } = parseAttendanceColumns(header.headers)
  const maxScores = parseDeclaredMaxScores(ws, header.rowNumber, course, header.mapping)

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

  return {
    meta,
    students: rows.students,
    attendance: rows.attendance,
    attendanceSessions: sessions,
    declaredMaxScores: maxScores.scores,
    studentExcelRows: rows.studentExcelRows
  }
}
