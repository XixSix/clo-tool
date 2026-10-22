/**
 * Tiện ích đọc Excel dùng chung cho Config và file điểm thô.
 * Chỉ phụ thuộc ExcelJS (không phụ thuộc Electron/React).
 */

import ExcelJS from 'exceljs'
import { matchHeaders, normalizeHeader, type HeaderMatchResult } from './headerMatcher'

export async function readWorkbook(filePath: string): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(filePath)
  return wb
}

/** Tìm sheet theo tên, không phân biệt hoa/thường và dấu */
export function findSheet(wb: ExcelJS.Workbook, sheetName: string): ExcelJS.Worksheet | undefined {
  const target = normalizeHeader(sheetName)
  return wb.worksheets.find((ws) => normalizeHeader(ws.name) === target)
}

/** Đọc text an toàn (xử lý ô gộp, richText, công thức, ngày) */
export function cellText(cell: ExcelJS.Cell | undefined): string {
  if (!cell) return ''
  const value = cell.value
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

export interface HeaderRowResult {
  rowNumber: number
  headers: string[]
  match: HeaderMatchResult
}

/**
 * Dò hàng tiêu đề: hàng có nhiều cột khớp nhất với danh sách cột chuẩn.
 */
export function findHeaderRow(
  ws: ExcelJS.Worksheet,
  expectedColumns: string[],
  maxScanRows = 20
): HeaderRowResult | null {
  const columnCount = Math.max(ws.columnCount, expectedColumns.length)
  let best: HeaderRowResult | null = null

  for (let r = 1; r <= Math.min(ws.rowCount, maxScanRows); r++) {
    const headers = rowTexts(ws.getRow(r), columnCount)
    const match = matchHeaders(headers, expectedColumns)
    if (!best || Object.keys(match.mapping).length > Object.keys(best.match.mapping).length) {
      best = { rowNumber: r, headers, match }
    }
  }

  if (!best) return null
  return Object.keys(best.match.mapping).length >= Math.min(2, expectedColumns.length) ? best : null
}

/** Ghi workbook ra file, tự tạo thư mục cha */
export async function writeWorkbook(wb: ExcelJS.Workbook, filePath: string): Promise<void> {
  const path = await import('node:path')
  const fs = await import('node:fs')
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  await wb.xlsx.writeFile(filePath)
}
