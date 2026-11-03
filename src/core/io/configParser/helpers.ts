/**
 * Tiện ích dùng chung cho bộ parser Config (tách module theo từng sheet).
 *
 * - Dò tiêu đề theo TÊN CỘT (không theo vị trí cố định).
 * - Tên cột có thể lệch dấu/khoảng trắng/hoa thường; nếu lệch nhiều sẽ gợi ý.
 */

import { cellText, findHeaderRow, rowTexts } from '../../utils/excel'
import type ExcelJS from 'exceljs'
import { ConfigParseError } from './errors'

/** Tên cột chuẩn của từng sheet (dùng để dò tiêu đề) */
export const CONFIG_SHEET_COLUMNS: Record<string, string[]> = {
  HOC_PHAN: ['Ma_HP', 'Ten_HP', 'So_Tin_Chi', 'Hinh_Thuc_Thi', 'Loai_HP'],
  CLO_LIST: ['Ma_CLO', 'Noi_Dung', 'Bac_Nang_Luc', 'Trong_So_CLO'],
  KE_HOACH_DANH_GIA: [
    'Nhom',
    'Thanh_Phan',
    'Ma_Dau_Diem',
    'CLO',
    'Trong_So_Phan_Tram',
    'Hinh_Thuc'
  ],
  CAU_HOI: ['Ma_Cot_Diem', 'Ma_Dau_Diem', 'Cau', 'CLO', 'Diem_Toi_Da', 'Ma_De', 'Loai'],
  MA_TRAN_PLO: ['PLO', 'PI', 'CLO']
}

/** Đọc giá trị 1 ô theo tên cột đã dò được; thiếu cột → chuỗi rỗng */
export function get(
  ws: ExcelJS.Worksheet,
  rowNumber: number,
  headers: Record<string, number>,
  column: string
): string {
  const idx = headers[column]
  if (idx === undefined) return ''
  return cellText(ws.getRow(rowNumber).getCell(idx + 1))
}

/**
 * Đọc một sheet dạng bảng: trả về header map + danh sách dòng dữ liệu không rỗng.
 */
export function readTable(
  ws: ExcelJS.Worksheet,
  columns: string[],
  sheetName: string
): { headers: Record<string, number>; rows: number[] } {
  const header = findHeaderRow(ws, columns)
  if (!header) {
    throw new ConfigParseError(
      `Không tìm thấy hàng tiêu đề của sheet ${sheetName}. Cần tối thiểu các cột: ${columns.join(', ')}`
    )
  }

  if (header.match.missing.length > 0) {
    const missing = header.match.missing
      .map((column) => {
        const suggestion = header.match.suggestions[column]
        return suggestion ? `"${column}" (gợi ý: "${suggestion}")` : `"${column}"`
      })
      .join(', ')
    throw new ConfigParseError(`Thiếu cột ${missing} trong sheet ${sheetName}.`)
  }

  const rows: number[] = []
  for (let r = header.rowNumber + 1; r <= ws.rowCount; r++) {
    const texts = rowTexts(ws.getRow(r), ws.columnCount)
    if (texts.some((t) => t.trim() !== '')) rows.push(r)
  }

  return { headers: header.match.mapping, rows }
}
