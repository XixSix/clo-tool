/**
 * Parse sheet CAU_HOI — ma trận cột điểm ↔ CLO (hỗ trợ nhiều mã đề).
 */

import type ExcelJS from 'exceljs'
import type { QuestionColumn, ValidationIssue } from '../../types'
import { findSheet, parseNumber } from '../excelUtils'
import { CONFIG_SHEET_COLUMNS, get, readTable } from './helpers'

export function parseCauHoiSheet(wb: ExcelJS.Workbook, issues: ValidationIssue[]): QuestionColumn[] {
  const cauHoi: QuestionColumn[] = []

  const ws = findSheet(wb, 'CAU_HOI')
  if (!ws) {
    issues.push({ level: 'error', message: 'Thiếu sheet CAU_HOI trong file Config.' })
    return cauHoi
  }

  const { headers, rows } = readTable(ws, CONFIG_SHEET_COLUMNS.CAU_HOI, 'CAU_HOI', issues)
  for (const r of rows) {
    const maCotDiem = get(ws, r, headers, 'Ma_Cot_Diem')
    const maDauDiem = get(ws, r, headers, 'Ma_Dau_Diem')
    if (!maCotDiem && !maDauDiem) continue
    const loaiRaw = get(ws, r, headers, 'Loai').toUpperCase()
    cauHoi.push({
      maCotDiem,
      maDauDiem,
      cau: get(ws, r, headers, 'Cau'),
      clo: get(ws, r, headers, 'CLO'),
      diemToiDa: parseNumber(get(ws, r, headers, 'Diem_Toi_Da')) ?? 0,
      maDe: get(ws, r, headers, 'Ma_De') || 'ALL',
      loai: loaiRaw === 'TN' ? 'TN' : loaiRaw === 'TL' ? 'TL' : undefined
    })
  }
  return cauHoi
}
