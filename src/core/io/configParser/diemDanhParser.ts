/**
 * Parse sheet DIEM_DANH — ký hiệu điểm danh và hệ số.
 * Sheet tuỳ chọn: thiếu hoặc rỗng → undefined (dùng mặc định của applyAttendance).
 */

import type ExcelJS from 'exceljs'
import type { AttendanceRule } from '../../types'
import { findSheet, parseNumber } from '../../utils/excel'
import { CONFIG_SHEET_COLUMNS, get, readTable } from './helpers'
export function parseDiemDanhSheet(wb: ExcelJS.Workbook): AttendanceRule[] | undefined {
  const diemdanh: AttendanceRule[] = []

  const ws = findSheet(wb, 'DIEM_DANH')
  if (!ws) return undefined

  const { headers, rows } = readTable(ws, CONFIG_SHEET_COLUMNS.DIEM_DANH, 'DIEM_DANH')
  if (rows.length === 0) return undefined

  for (const r of rows) {
    diemdanh.push({
      kyHieu: get(ws, r, headers, 'Ky_Hieu'),
      heSo: parseNumber(get(ws, r, headers, 'He_So')) ?? 0,
      dienGiai: get(ws, r, headers, 'Dien_Giai') || undefined
    })
  }
  return diemdanh.length > 0 ? diemdanh : undefined
}
