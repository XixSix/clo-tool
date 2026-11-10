/**
 * Parse sheet CAU_HOI — ma trận cột điểm ↔ CLO (hỗ trợ nhiều mã đề).
 */

import type ExcelJS from 'exceljs'
import type { QuestionColumn } from '../../types'
import { findSheet, parseNumber } from '../../utils/excel'
import { CONFIG_SHEET_COLUMNS, get, readConfigTable } from './helpers'
import { ConfigParseError } from './errors'

export function parseCauHoiSheet(wb: ExcelJS.Workbook): QuestionColumn[] {
  const cauHoi: QuestionColumn[] = []

  const ws = findSheet(wb, 'CAU_HOI')
  if (!ws) {
    throw new ConfigParseError('Thiếu sheet CAU_HOI trong file Config.')
  }

  const { headers, rows } = readConfigTable(ws, CONFIG_SHEET_COLUMNS.CAU_HOI, 'CAU_HOI')
  if (rows.length === 0) {
    throw new ConfigParseError('Sheet CAU_HOI không có dữ liệu.')
  }
  for (const r of rows) {
    const loaiRaw = get(ws, r, headers, 'Loai').toUpperCase()
    cauHoi.push({
      maCotDiem: get(ws, r, headers, 'Ma_Cot_Diem'),
      maDauDiem: get(ws, r, headers, 'Ma_Dau_Diem'),
      cau: get(ws, r, headers, 'Cau'),
      clo: get(ws, r, headers, 'CLO'),
      diemToiDa: parseNumber(get(ws, r, headers, 'Diem_Toi_Da')) ?? 0,
      maDe: get(ws, r, headers, 'Ma_De') || 'ALL',
      loai: loaiRaw === 'TN' ? 'TN' : loaiRaw === 'TL' ? 'TL' : undefined
    })
  }
  return cauHoi
}
