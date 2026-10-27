/**
 * Đọc từng dòng sinh viên, điểm các cột và ký hiệu điểm danh.
 */

import type ExcelJS from 'exceljs'
import type { AttendanceRecord, RawStudentRow } from '../../types'
import { cellText, parseNumber } from '../../utils/excel'
import { RawGradesParseError } from './errors'
import { columnCell, missingMaSv } from './helpers'
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
  const students: RawStudentRow[] = []
  const attendance: AttendanceRecord[] = []

  for (let r = firstStudentRow; r <= ws.rowCount; r++) {
    const row = ws.getRow(r)
    const maSvCell = columnCell(row, mapping, 'Ma_SV')
    const maSv = cellText(maSvCell).trim()
    const ho = cellText(columnCell(row, mapping, 'Ho')).trim()
    const ten = cellText(columnCell(row, mapping, 'Ten')).trim()
    const hoTenFull = cellText(columnCell(row, mapping, 'Ho_Ten')).trim()
    const hoTen = hoTenFull || [ho, ten].filter(Boolean).join(' ')

    // Dòng ghi chú/hướng dẫn thường là ô gộp: bỏ qua, không coi là sinh viên
    if (maSvCell?.isMerged) continue
    if (!maSv && !hoTen) continue

    const diemCacCot: RawStudentRow['diemCacCot'] = {}
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
      throw new RawGradesParseError(
        `Giá trị "${invalid.raw}" không phải là điểm số hợp lệ (chỉ nhận số hoặc "VT") tại dòng ${r}, cột "${invalid.maCot}".`
      )
    }

    const studentMaSv = maSv || missingMaSv(r)

    students.push({
      tt:
        parseNumber(
          cellText(mapping.TT !== undefined ? row.getCell(mapping.TT + 1) : row.getCell(1))
        ) ?? students.length + 1,
      maSv: studentMaSv,
      hoTen,
      ngaySinh: cellText(columnCell(row, mapping, 'Ngay_Sinh')).trim() || undefined,
      maDe: cellText(columnCell(row, mapping, 'Ma_De')).trim() || undefined,
      diemCacCot,
      ghiChu: cellText(columnCell(row, mapping, 'Ghi_Chu')).trim() || undefined,
      excelRow: r
    })

    if (attendanceColumns.length > 0) {
      const symbols: Record<string, string> = {}
      for (const column of attendanceColumns) {
        symbols[column.label] = cellText(row.getCell(column.index + 1)).trim()
      }
      attendance.push({ maSv: studentMaSv, symbols })
    }
  }

  return { students, attendance }
}
