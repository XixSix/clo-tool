/**
 * Parse sheet KE_HOACH_DANH_GIA — kế hoạch đánh giá (Bảng 3/4 QĐ450).
 */

import type ExcelJS from 'exceljs'
import type { EvaluationPlanItem, ValidationIssue } from '../../types'
import { findSheet, parseNumber } from '../excelUtils'
import { CONFIG_SHEET_COLUMNS, get, readTable } from './helpers'

export function parseKeHoachSheet(
  wb: ExcelJS.Workbook,
  issues: ValidationIssue[]
): EvaluationPlanItem[] {
  const keHoachDanhGia: EvaluationPlanItem[] = []

  const ws = findSheet(wb, 'KE_HOACH_DANH_GIA')
  if (!ws) {
    issues.push({ level: 'error', message: 'Thiếu sheet KE_HOACH_DANH_GIA trong file Config.' })
    return keHoachDanhGia
  }

  const { headers, rows } = readTable(
    ws,
    CONFIG_SHEET_COLUMNS.KE_HOACH_DANH_GIA,
    'KE_HOACH_DANH_GIA',
    issues
  )
  for (const r of rows) {
    const nhomRaw = get(ws, r, headers, 'Nhom').toUpperCase()
    const maDauDiem = get(ws, r, headers, 'Ma_Dau_Diem')
    const clo = get(ws, r, headers, 'CLO')
    const trongSo = parseNumber(get(ws, r, headers, 'Trong_So_Phan_Tram'))
    if (!maDauDiem && !clo) continue
    if (!['CC', 'GK', 'CK'].includes(nhomRaw)) {
      issues.push({
        level: 'error',
        sheet: 'KE_HOACH_DANH_GIA',
        row: r,
        column: 'Nhom',
        message: `Nhóm "${nhomRaw}" không hợp lệ (chỉ nhận CC, GK, CK).`
      })
      continue
    }
    keHoachDanhGia.push({
      nhom: nhomRaw as 'CC' | 'GK' | 'CK',
      thanhPhan: get(ws, r, headers, 'Thanh_Phan'),
      maDauDiem,
      clo,
      trongSoPhanTram: trongSo ?? 0,
      hinhThuc: get(ws, r, headers, 'Hinh_Thuc') || undefined
    })
  }
  return keHoachDanhGia
}
