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

/** Ghi workbook ra file, tự tạo thư mục cha */
export async function writeWorkbook(wb: ExcelJS.Workbook, filePath: string): Promise<void> {
  const path = await import('node:path')
  const fs = await import('node:fs')
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  await wb.xlsx.writeFile(filePath)
}
