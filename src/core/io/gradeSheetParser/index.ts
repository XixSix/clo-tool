/**
 * Đọc file điểm thô của lớp (.xlsx) → GradeSheetData.
 *
 * Mỗi phần việc nằm trong một module riêng:
 * - metaParser: thông tin lớp
 * - headerParser: dò tiêu đề + cột điểm
 * - attendanceParser: cột điểm danh
 * - maxScoreParser: hàng "Điểm tối đa"
 * - studentParser: dữ liệu sinh viên
 * - toStudentRecords: chuyển GradeSheetData → Student + StudentCourseScoreRecord
 *
 * Parser chỉ chịu trách nhiệm đọc dữ liệu; lỗi cấu trúc hoặc ô không parse được
 * sẽ ném `GradeSheetParseError` thay vì trả về issue cho validator.
 */

import type { Course, GradeSheetData } from '../../types'
import { findSheet, readWorkbook } from '../../utils/excel'
import { parseAttendanceColumns } from './attendanceParser'
import { GradeSheetParseError } from './errors'
import { assertScoreColumns, parseGradeSheetHeader } from './headerParser'
import { parseDeclaredMaxScores } from './maxScoreParser'
import { parseGradeSheetMeta } from './metaParser'
import { parseStudentRows } from './studentParser'

export * from './errors'
export * from './toStudentRecords'

export async function parseGradeSheet(filePath: string, course: Course): Promise<GradeSheetData> {
  const wb = await readWorkbook(filePath)
  const ws = findSheet(wb, 'NHAP_LIEU') ?? findSheet(wb, 'NHAP_LIEU_GV') ?? wb.worksheets[0]

  if (!ws) {
    throw new GradeSheetParseError('File điểm thô không có sheet dữ liệu.')
  }

  const parsedHeader = parseGradeSheetHeader(ws, course)
  if (!parsedHeader) {
    throw new GradeSheetParseError(
      'Không tìm thấy hàng tiêu đề (cần có cột "Mã SV", "Họ", "Tên"...).'
    )
  }

  const { header, scoreColumns } = parsedHeader
  assertScoreColumns(header, scoreColumns)

  const meta = parseGradeSheetMeta(ws, header.rowNumber)
  const { sessions, columns } = parseAttendanceColumns(header.headers)
  const maxScores = parseDeclaredMaxScores(ws, header.rowNumber, course, header.mapping)

  const rows = parseStudentRows({
    ws,
    mapping: header.mapping,
    scoreColumns,
    firstStudentRow: maxScores.dongSinhVienDau,
    attendanceColumns: columns
  })

  if (rows.sinhVien.length === 0) {
    throw new GradeSheetParseError('Không đọc được sinh viên nào.')
  }

  return {
    thongTin: meta,
    sinhVien: rows.sinhVien,
    buoiDiemDanh: sessions,
    diemToiDaKhaiBao: maxScores.diemToiDa,
    dongExcelSinhVien: rows.dongExcelSinhVien
  }
}
