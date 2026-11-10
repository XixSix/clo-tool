/**
 * Tiện ích đọc/ghi WORKBOOK: mở file, dò sheet theo tên, dò hàng tiêu đề.
 *
 * Chỉ phụ thuộc ExcelJS (không phụ thuộc Electron/React).
 * Việc đọc giá trị từng ô nằm ở `cellValue.ts`, dò tên cột ở `headerMatcher.ts`.
 */

import ExcelJS from 'exceljs'
import { rowTexts } from './cellValue'
import { matchHeaders, normalizeHeader, type HeaderMatchResult } from './headerMatcher'

/** Đọc 1 file excel */
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

/** Kết quả đọc một sheet dạng bảng có schema cố định */
export interface TableReadResult {
  rowNumber: number
  /** Tiêu đề thực tế của file, giữ đúng thứ tự cột */
  headerTexts: string[]
  /** Tên cột chuẩn -> chỉ số cột (0-based) */
  mapping: Record<string, number>
  /** Tên cột thiếu -> tên gần giống trong file */
  suggestions: Record<string, string>
  /** Số dòng dữ liệu không rỗng nằm dưới header */
  rows: number[]
}

export interface ReadTableOptions {
  maxScanRows?: number
  /** Tạo loại lỗi phù hợp với từng loại file (Config / điểm thô) */
  makeError?: (message: string) => Error
}

/**
 * Đọc một sheet dạng bảng: dò header, bắt buộc đủ cột, trả về mapping + dòng dữ liệu.
 *
 * Dùng chung cho Config và file điểm thô để cả hai cùng một quy tắc:
 * header cố định một hàng, thiếu cột bắt buộc thì dừng ngay.
 */
export function readTable(
  ws: ExcelJS.Worksheet,
  columns: string[],
  sheetName: string,
  options: ReadTableOptions = {}
): TableReadResult {
  const makeError = options.makeError ?? ((message: string) => new Error(message))
  const header = findHeaderRow(ws, columns, options.maxScanRows)
  if (!header) {
    throw makeError(
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
    throw makeError(`Thiếu cột ${missing} trong sheet ${sheetName}.`)
  }

  const rows: number[] = []
  for (let r = header.rowNumber + 1; r <= ws.rowCount; r++) {
    const texts = rowTexts(ws.getRow(r), ws.columnCount)
    if (texts.some((t) => t.trim() !== '')) rows.push(r)
  }

  return {
    rowNumber: header.rowNumber,
    headerTexts: header.headers,
    mapping: header.match.mapping,
    suggestions: header.match.suggestions,
    rows
  }
}

/** Ghi workbook ra file, tự tạo thư mục cha */
export async function writeWorkbook(wb: ExcelJS.Workbook, filePath: string): Promise<void> {
  const path = await import('node:path')
  const fs = await import('node:fs')
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  await wb.xlsx.writeFile(filePath)
}
