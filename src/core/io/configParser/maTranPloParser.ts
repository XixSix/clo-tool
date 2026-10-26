/**
 * Parse sheet MA_TRAN_PLO — ánh xạ CLO → PI → PLO (Bảng 2 QĐ450).
 */

import type ExcelJS from 'exceljs'
import type { PLOMapping } from '../../types'
import { findSheet } from '../../utils/excel'
import { CONFIG_SHEET_COLUMNS, get, readTable } from './helpers'
import { ConfigParseError } from './errors'

export function parseMaTranPloSheet(wb: ExcelJS.Workbook): PLOMapping[] {
  const maTranPlo: PLOMapping[] = []

  const ws = findSheet(wb, 'MA_TRAN_PLO')
  if (!ws) throw new ConfigParseError('Thiếu sheet MA_TRAN_PLO trong file Config.')

  const { headers, rows } = readTable(ws, CONFIG_SHEET_COLUMNS.MA_TRAN_PLO, 'MA_TRAN_PLO')
  for (const r of rows) {
    const plo = get(ws, r, headers, 'PLO')
    const clo = get(ws, r, headers, 'CLO')
    if (!plo || !clo) continue
    maTranPlo.push({ plo, pi: get(ws, r, headers, 'PI'), clo })
  }
  return maTranPlo
}
