/**
 * Tiện ích đọc/ghi GIÁ TRỊ Ô Excel: text an toàn, số, boolean, ngày.
 *
 * Chỉ phụ thuộc ExcelJS (không phụ thuộc Electron/React).
 * Việc mở/ghi workbook và dò tiêu đề nằm ở `workbook.ts`.
 */

import ExcelJS from 'exceljs'
import { normalizeHeader } from './headerMatcher'

/** Đọc text an toàn (xử lý ô gộp, richText, công thức, ngày) */
export function cellText(cell: ExcelJS.Cell | undefined): string {
  if (!cell) return ''

  const targetCell = cell.isMerged && cell.master ? cell.master : cell
  const value = targetCell.value

  if (value === null || value === undefined) return ''
  if (value instanceof Date) return formatDate(value)
  if (typeof value === 'object') {
    if ('richText' in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text).join('')
    }
    if ('text' in value) return String(value.text ?? '')
    if ('result' in value) return String(value.result ?? '')
    if ('formula' in value) return ''
  }
  try {
    return String(cell.text ?? '').trim()
  } catch {
    return ''
  }
}

export function formatDate(date: Date): string {
  if (isNaN(date.getTime())) return ''
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${d}/${m}/${date.getFullYear()}`
}

/** Chấp nhận cả "2,5" và "2.5" (dán từ Google Sheets/Excel) */
export function parseNumber(raw: string | number | undefined | null): number | null {
  if (raw === null || raw === undefined) return null
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null
  const text = raw.toString().trim().replace(/\s/g, '')
  if (text === '') return null
  const normalized = text.replace(',', '.')
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) return null
  const value = Number(normalized)
  return Number.isFinite(value) ? value : null
}

export function parseBoolean(raw: string | undefined, fallback: boolean): boolean {
  if (raw === undefined) return fallback
  const text = normalizeHeader(raw)
  if (['true', '1', 'yes', 'co', 'bat'].includes(text)) return true
  if (['false', '0', 'no', 'khong', 'tat'].includes(text)) return false
  return fallback
}

/** Lấy danh sách text của một hàng */
export function rowTexts(row: ExcelJS.Row, maxColumn: number): string[] {
  const result: string[] = []
  for (let c = 1; c <= maxColumn; c++) {
    result.push(cellText(row.getCell(c)))
  }
  return result
}
