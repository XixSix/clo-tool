/**
 * Parse sheet CLO_LIST — danh mục chuẩn đầu ra (CLO).
 */

import type ExcelJS from 'exceljs'
import type { CLODefinition } from '../../types'
import { findSheet, parseNumber } from '../../utils/excel'
import { CONFIG_SHEET_COLUMNS, get, readConfigTable } from './helpers'
import { ConfigParseError } from './errors'

export function parseCloListSheet(wb: ExcelJS.Workbook): CLODefinition[] {
  const cloList: CLODefinition[] = []

  const ws = findSheet(wb, 'CLO_LIST')
  if (!ws) {
    throw new ConfigParseError('Thiếu sheet CLO_LIST trong file Config.')
  }

  const { headers, rows } = readConfigTable(ws, CONFIG_SHEET_COLUMNS.CLO_LIST, 'CLO_LIST')
  if (rows.length === 0) {
    throw new ConfigParseError('Sheet CLO_LIST không có dữ liệu.')
  }
  for (const r of rows) {
    cloList.push({
      maClo: get(ws, r, headers, 'Ma_CLO'),
      noiDung: get(ws, r, headers, 'Noi_Dung'),
      bacNangLuc: get(ws, r, headers, 'Bac_Nang_Luc'),
      trongSoClo: parseNumber(get(ws, r, headers, 'Trong_So_CLO')) ?? undefined
    })
  }
  return cloList
}
