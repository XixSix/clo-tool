/**
 * Parse sheet DIEM_DANH — ký hiệu điểm danh và hệ số.
 * Sheet tuỳ chọn: thiếu hoặc rỗng → undefined (dùng mặc định của applyAttendance).
 */

import type ExcelJS from 'exceljs'
import type { AttendanceRule, ValidationIssue } from '../../types'
import { findSheet, parseNumber } from '../excelUtils'
import { CONFIG_SHEET_COLUMNS, get, readTable } from './helpers'

export function parseDiemDanhSheet(
  wb: ExcelJS.Workbook,
  issues: ValidationIssue[]
): AttendanceRule[] | undefined {
  const ws = findSheet(wb, 'DIEM_DANH')
  if (!ws) return undefined

  const { headers, rows } = readTable(ws, CONFIG_SHEET_COLUMNS.DIEM_DANH, 'DIEM_DANH', issues)
  const parsed: AttendanceRule[] = []
  for (const r of rows) {
    const kyHieu = get(ws, r, headers, 'Ky_Hieu')
    if (!kyHieu) continue
    parsed.push({
      kyHieu,
      heSo: parseNumber(get(ws, r, headers, 'He_So')) ?? 0,
      dienGiai: get(ws, r, headers, 'Dien_Giai') || undefined
    })
  }
  return parsed.length > 0 ? parsed : undefined
}
