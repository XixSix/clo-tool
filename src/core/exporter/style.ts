/**
 * Helper định dạng Excel dùng chung cho các sheet xuất báo cáo.
 */

import type ExcelJS from 'exceljs'

export const FONT_NAME = 'Times New Roman'

export const BORDER_THIN: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FF9CA3AF' } },
  left: { style: 'thin', color: { argb: 'FF9CA3AF' } },
  bottom: { style: 'thin', color: { argb: 'FF9CA3AF' } },
  right: { style: 'thin', color: { argb: 'FF9CA3AF' } }
}

export function styleCell(
  cell: ExcelJS.Cell,
  options: {
    bold?: boolean
    size?: number
    align?: 'left' | 'center' | 'right'
    vertical?: 'top' | 'middle' | 'bottom'
    wrap?: boolean
    fill?: string
    color?: string
  } = {}
): void {
  cell.font = {
    name: FONT_NAME,
    size: options.size ?? 11,
    bold: options.bold ?? false,
    color: { argb: options.color ?? 'FF111827' }
  }
  cell.alignment = {
    horizontal: options.align ?? 'left',
    vertical: options.vertical ?? 'middle',
    wrapText: options.wrap ?? false
  }
  if (options.fill) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: options.fill } }
  }
}

export function styleTitle(ws: ExcelJS.Worksheet, rowNumber: number, columnCount: number): void {
  const row = ws.getRow(rowNumber)
  row.height = 28
  for (let c = 1; c <= columnCount; c++) {
    styleCell(row.getCell(c), { bold: true, size: 14, align: 'center' })
  }
}

export function styleHeaderRow(
  ws: ExcelJS.Worksheet,
  rowNumber: number,
  columnCount: number,
  fill = 'FFDBEAFE'
): void {
  const row = ws.getRow(rowNumber)
  row.height = 30
  for (let c = 1; c <= columnCount; c++) {
    const cell = row.getCell(c)
    styleCell(cell, { bold: true, size: 11, align: 'center', wrap: true, fill })
    cell.border = BORDER_THIN
  }
}

export function applyBorders(
  ws: ExcelJS.Worksheet,
  fromRow: number,
  toRow: number,
  fromCol: number,
  toCol: number
): void {
  for (let r = fromRow; r <= toRow; r++) {
    for (let c = fromCol; c <= toCol; c++) {
      ws.getRow(r).getCell(c).border = BORDER_THIN
    }
  }
}

export function setWidths(ws: ExcelJS.Worksheet, widths: number[]): void {
  widths.forEach((width, idx) => {
    ws.getColumn(idx + 1).width = width
  })
}

export function labelValueRow(
  ws: ExcelJS.Worksheet,
  rowNumber: number,
  label: string,
  value: string,
  labelCol = 1,
  valueCol = 2
): void {
  const labelCell = ws.getRow(rowNumber).getCell(labelCol)
  const valueCell = ws.getRow(rowNumber).getCell(valueCol)
  styleCell(labelCell, { bold: true })
  styleCell(valueCell)
  labelCell.value = label
  valueCell.value = value
}

export function mergeRow(
  ws: ExcelJS.Worksheet,
  rowNumber: number,
  fromCol: number,
  toCol: number
): void {
  if (toCol > fromCol) ws.mergeCells(rowNumber, fromCol, rowNumber, toCol)
}

/** Định dạng ngày Việt Nam dd/mm/yyyy */
export function formatDateVi(input?: string | Date): string {
  if (!input) return ''
  if (input instanceof Date) {
    const d = String(input.getDate()).padStart(2, '0')
    const m = String(input.getMonth() + 1).padStart(2, '0')
    return `${d}/${m}/${input.getFullYear()}`
  }
  return input
}
