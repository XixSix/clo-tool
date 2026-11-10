/**
 * Parse sheet KE_HOACH_DANH_GIA — kế hoạch đánh giá (Bảng 3/4 QĐ450).
 */

import type ExcelJS from 'exceljs'
import type { EvaluationPlanItem } from '../../types'
import { findSheet, parseNumber, cellText, getMergedRowRange } from '../../utils/excel'
import { CONFIG_SHEET_COLUMNS, get, readConfigTable } from './helpers'
import { ConfigParseError } from './errors'

export function parseKeHoachSheet(wb: ExcelJS.Workbook): EvaluationPlanItem[] {
  const keHoachDanhGia: EvaluationPlanItem[] = []

  const ws = findSheet(wb, 'KE_HOACH_DANH_GIA')
  if (!ws) {
    throw new ConfigParseError('Thiếu sheet KE_HOACH_DANH_GIA trong file Config.')
  }

  const { headers, rows } = readConfigTable(
    ws,
    CONFIG_SHEET_COLUMNS.KE_HOACH_DANH_GIA,
    'KE_HOACH_DANH_GIA'
  )
  if (rows.length === 0) {
    throw new ConfigParseError('Sheet KE_HOACH_DANH_GIA không có dữ liệu.')
  }

  const planRows = new Set(rows)
  const weightColIdx = headers['Trong_So_Phan_Tram']

  for (const r of rows) {
    const nhomRaw = get(ws, r, headers, 'Nhom').toUpperCase()

    // Trọng số có thể được gộp ô dọc qua nhiều dòng CLO của cùng một đầu điểm
    // (ví dụ đề cương ghi "Kiểm tra định kỳ: 30%" cho CLO1..CLO4). Khi đó ô
    // chỉ chứa MỘT giá trị tổng; chia đều cho số dòng kế hoạch nằm trong vùng gộp.
    let trongSo = 0
    if (weightColIdx !== undefined) {
      const cell = ws.getRow(r).getCell(weightColIdx + 1)
      const rawVal = parseNumber(cellText(cell)) ?? 0
      const range = getMergedRowRange(ws, cell)
      if (range) { // nếu được gộp
        let span = 0
        for (let i = range.top; i <= range.bottom; i++) {
          if (planRows.has(i)) span++
        }
        trongSo = span > 0 ? rawVal / span : rawVal
      } else {
        trongSo = rawVal
      }
    }

    keHoachDanhGia.push({
      nhom: nhomRaw as 'CC' | 'GK' | 'CK',
      thanhPhan: get(ws, r, headers, 'Thanh_Phan'),
      maDauDiem: get(ws, r, headers, 'Ma_Dau_Diem'),
      clo: get(ws, r, headers, 'CLO'),
      trongSoPhanTram: trongSo,
      hinhThuc: get(ws, r, headers, 'Hinh_Thuc') || undefined
    })
  }
  return keHoachDanhGia
}
