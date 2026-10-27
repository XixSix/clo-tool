/**
 * Parse sheet KE_HOACH_DANH_GIA — kế hoạch đánh giá (Bảng 3/4 QĐ450).
 */

import type ExcelJS from 'exceljs'
import type { EvaluationPlanItem } from '../../types'
import { findSheet, parseNumber } from '../../utils/excel'
import { CONFIG_SHEET_COLUMNS, get, readTable } from './helpers'
import { ConfigParseError } from './errors'

export function parseKeHoachSheet(wb: ExcelJS.Workbook): EvaluationPlanItem[] {
  const keHoachDanhGia: EvaluationPlanItem[] = []

  const ws = findSheet(wb, 'KE_HOACH_DANH_GIA')
  if (!ws) {
    throw new ConfigParseError('Thiếu sheet KE_HOACH_DANH_GIA trong file Config.')
  }

  const { headers, rows } = readTable(
    ws,
    CONFIG_SHEET_COLUMNS.KE_HOACH_DANH_GIA,
    'KE_HOACH_DANH_GIA'
  )
  if (rows.length === 0) {
    throw new ConfigParseError('Sheet KE_HOACH_DANH_GIA không có dữ liệu.')
  }
  for (const r of rows) {
    const nhomRaw = get(ws, r, headers, 'Nhom').toUpperCase()
    keHoachDanhGia.push({
      nhom: nhomRaw as 'CC' | 'GK' | 'CK',
      thanhPhan: get(ws, r, headers, 'Thanh_Phan'),
      maDauDiem: get(ws, r, headers, 'Ma_Dau_Diem'),
      clo: get(ws, r, headers, 'CLO'),
      trongSoPhanTram: parseNumber(get(ws, r, headers, 'Trong_So_Phan_Tram')) ?? 0,
      hinhThuc: get(ws, r, headers, 'Hinh_Thuc') || undefined
    })
  }
  return keHoachDanhGia
}
