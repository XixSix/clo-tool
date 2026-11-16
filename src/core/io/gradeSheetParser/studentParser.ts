/**
 * Đọc từng dòng sinh viên, điểm các cột và ký hiệu điểm danh.
 */

import type ExcelJS from 'exceljs'
import type { SheetStudentRow } from '../../types'
import { cellText, parseNumber } from '../../utils/excel'
import { GradeSheetParseError } from './errors'
import { columnCell, missingMaSv, parseStudentName } from './helpers'
import type { AttendanceColumn, ParsedStudentRows } from './types'

export interface ParseStudentRowsOptions {
  ws: ExcelJS.Worksheet
  mapping: Record<string, number>
  scoreColumns: string[]
  firstStudentRow: number
  attendanceColumns: AttendanceColumn[]
}

export function parseStudentRows({
  ws,
  mapping,
  scoreColumns,
  firstStudentRow,
  attendanceColumns
}: ParseStudentRowsOptions): ParsedStudentRows {
  const students: SheetStudentRow[] = []
  const studentExcelRows: number[] = []

  for (let r = firstStudentRow; r <= ws.rowCount; r++) {
    const row = ws.getRow(r)
    const maSvCell = columnCell(row, mapping, 'Ma_SV')
    const maSv = cellText(maSvCell).trim()
    const { ho, ten, hoTen } = parseStudentName(row, mapping)

    // Dòng ghi chú/hướng dẫn thường là ô gộp: bỏ qua, không coi là sinh viên
    if (maSvCell?.isMerged) continue
    if (!maSv && !hoTen) continue

    const diemCacCot: SheetStudentRow['diem']['diemCacCot'] = {}
    const invalidCells: { maCot: string; raw: string }[] = []

    for (const maCot of scoreColumns) {
      const index = mapping[maCot]
      if (index === undefined) continue

      const cell = row.getCell(index + 1)
      const raw = cellText(cell).trim()

      if (raw === '') {
        diemCacCot[maCot] = null
      } else if (/^vt$/i.test(raw)) {
        diemCacCot[maCot] = 'VT'
      } else {
        const value = parseNumber(raw)
        if (value === null) {
          // Cột điểm nằm trong ô gộp (dòng ghi chú) -> bỏ qua cả dòng
          if (cell.isMerged) {
            invalidCells.length = 0
            diemCacCot[maCot] = null
            break
          }
          invalidCells.push({ maCot, raw })
          diemCacCot[maCot] = null
        } else {
          diemCacCot[maCot] = value
        }
      }
    }

    for (const invalid of invalidCells) {
      throw new GradeSheetParseError(
        `Giá trị "${invalid.raw}" không phải là điểm số hợp lệ (chỉ nhận số hoặc "VT") tại dòng ${r}, cột "${invalid.maCot}".`
      )
    }

    const studentMaSv = maSv || missingMaSv(r)
    const ttCell = columnCell(row, mapping, 'TT')
    const ttParsed = parseNumber(ttCell ? cellText(ttCell) : cellText(row.getCell(1)))

    let diemDanh: Record<string, string> | undefined
    if (attendanceColumns.length > 0) {
      diemDanh = {}
      for (const column of attendanceColumns) {
        diemDanh[column.tenBuoi] = cellText(row.getCell(column.index + 1)).trim()
      }
    }

    students.push({
      sinhVien: {
        id: studentMaSv,
        tt: ttParsed ?? students.length + 1,
        maSv: studentMaSv,
        ho,
        ten,
        hoTen,
        ngaySinh: cellText(columnCell(row, mapping, 'Ngay_Sinh')).trim() || undefined
      },
      diem: { diemCacCot },
      diemDanh,
      ghiChu: cellText(columnCell(row, mapping, 'Ghi_Chu')).trim() || undefined
    })
    studentExcelRows.push(r)
  }

  return { sinhVien: students, dongExcelSinhVien: studentExcelRows }
}
