/**
 * Tiện ích đọc/ghi GIÁ TRỊ Ô Excel: text an toàn, số, boolean, ngày.
 *
 * Chỉ phụ thuộc ExcelJS (không phụ thuộc Electron/React).
 * Việc mở/ghi workbook và dò tiêu đề nằm ở `workbook.ts`.
 */

import ExcelJS from 'exceljs'
import { normalizeHeader } from '../normalizeVi'
import { formatDate } from '../formatDate'

/** Đọc text an toàn (xử lý ô gộp, richText, công thức, ngày) */
export function cellText(cell: ExcelJS.Cell | undefined): string {
  if (!cell) return ''
  const targetCell = cell.isMerged && cell.master ? cell.master : cell
  const value = targetCell.value

  if (value === null || value === undefined) return ''

  // 1. Xử lý Date trực tiếp
  if (value instanceof Date) {
    return formatDate(value)
  }

  // 2. Xử lý các kiểu Object phức tạp của ExcelJS
  if (typeof value === 'object') {
    // Rich Text
    if ('richText' in value && Array.isArray(value.richText)) {
      return value.richText
        .map((part) => part.text)
        .join('')
        .trim()
    }

    // Hyperlink ({ text, hyperlink })
    if ('text' in value && value.text !== undefined) {
      return String(value.text).trim()
    }

    // Formula ({ formula, result })
    if ('result' in value && value.result !== undefined && value.result !== null) {
      const res = value.result
      if (res instanceof Date) return formatDate(res)
      if (typeof res === 'object' && 'error' in res) return String(res.error).trim()
      return String(res).trim()
    }

    // Formula chưa có result
    if ('formula' in value) return ''

    // Cell error trực tiếp ({ error: '#VALUE!' })
    if ('error' in value) return String(value.error).trim()
  }

  // 3. Fallback: Dùng targetCell.text (đã qua format hiển thị của Excel) hoặc targetCell.value
  const formattedText = targetCell.text ?? String(value)
  return formattedText.trim()
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

/** Lấy vùng ô gộp (theo dòng) chứa ô này. Trả về null nếu ô không gộp. */
export function getMergedRowRange(
  ws: ExcelJS.Worksheet,
  cell: ExcelJS.Cell | undefined
): { top: number; bottom: number } | null {
  if (!cell || !cell.isMerged) return null
  const master = cell.master ?? cell
  const row = Number(cell.row)
  const merges = (
    ws as unknown as { _merges?: Record<string, { model: { top: number; bottom: number } }> }
  )._merges
  if (!merges) return null
  const direct = merges[master.address] ?? merges[cell.address]
  if (direct?.model) {
    return { top: direct.model.top, bottom: direct.model.bottom }
  }
  for (const r of Object.values(merges)) {
    if (r?.model && r.model.top <= row && row <= r.model.bottom) {
      return { top: r.model.top, bottom: r.model.bottom }
    }
  }
  return null
}
