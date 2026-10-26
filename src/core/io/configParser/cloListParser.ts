/**
 * Parse sheet CLO_LIST — danh mục chuẩn đầu ra (CLO).
 */

import type ExcelJS from 'exceljs'
import type { CLODefinition, ValidationIssue } from '../../types'
import { findSheet, parseNumber } from '../excelUtils'
import { CONFIG_SHEET_COLUMNS, get, readTable } from './helpers'

export function parseCloListSheet(wb: ExcelJS.Workbook, issues: ValidationIssue[]): CLODefinition[] {
  const cloList: CLODefinition[] = []

  const ws = findSheet(wb, 'CLO_LIST')
  if (!ws) {
    issues.push({ level: 'error', message: 'Thiếu sheet CLO_LIST trong file Config.' })
    return cloList
  }

  const { headers, rows } = readTable(ws, CONFIG_SHEET_COLUMNS.CLO_LIST, 'CLO_LIST', issues)
  for (const r of rows) {
    const maClo = get(ws, r, headers, 'Ma_CLO')
    if (!maClo) continue
    cloList.push({
      maClo,
      noiDung: get(ws, r, headers, 'Noi_Dung'),
      bacNangLuc: get(ws, r, headers, 'Bac_Nang_Luc'),
      trongSoClo: parseNumber(get(ws, r, headers, 'Trong_So_CLO')) ?? undefined
    })
  }
  return cloList
}
