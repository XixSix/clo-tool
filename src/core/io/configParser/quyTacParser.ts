/**
 * Parse sheet QUY_TAC — luật nghiệp vụ toàn cục.
 * Sheet được merge với DEFAULT_BUSINESS_RULES: thiếu khoá nào dùng mặc định khoá đó.
 */

import type ExcelJS from 'exceljs'
import type { BusinessRules } from '../../types'
import { DEFAULT_BUSINESS_RULES } from '../../rules'
import { findSheet, parseBoolean, parseNumber } from '../../utils/excel'
import { CONFIG_SHEET_COLUMNS, get, readTable } from './helpers'

function parseBusinessRules(
  ws: ExcelJS.Worksheet,
  headers: Record<string, number>,
  rows: number[],
): BusinessRules {
  const rules: BusinessRules = { ...DEFAULT_BUSINESS_RULES }

  for (const r of rows) {
    const key = get(ws, r, headers, 'Ma_Quy_Tac')
    const rawValue = get(ws, r, headers, 'Gia_Tri')
    if (!key) continue

    switch (key) {
      case 'hp_method':
        if (rawValue === 'QD450' || rawValue === 'RAW_POINTS') rules.hp_method = rawValue
        break
      case 'rounding_mode':
        if (rawValue === 'chain' || rawValue === 'final_only') rules.rounding_mode = rawValue
        break
      case 'clo_bo_phan':
        if (rawValue === 'mean_of_ratios' || rawValue === 'ratio_of_sums') {
          rules.clo_bo_phan = rawValue
        }
        break
      case 'nguong_dat_clo':
        rules.nguong_dat_clo = parseNumber(rawValue) ?? rules.nguong_dat_clo
        break
      case 'nguong_dat_plo':
        rules.nguong_dat_plo = parseNumber(rawValue) ?? rules.nguong_dat_plo
        break
      case 'nguong_dat_hp':
        rules.nguong_dat_hp = parseNumber(rawValue) ?? rules.nguong_dat_hp
        break
      case 'ty_le_nhom_27':
        rules.ty_le_nhom_27 = parseNumber(rawValue) ?? rules.ty_le_nhom_27
        break
      case 'nguong_co_mau_n':
        rules.nguong_co_mau_n = parseNumber(rawValue) ?? rules.nguong_co_mau_n
        break
      case 'tinh_sv_vang_thi':
        rules.tinh_sv_vang_thi = parseBoolean(rawValue, rules.tinh_sv_vang_thi)
        break
      case 'canh_bao_cc_don_le':
        rules.canh_bao_cc_don_le = parseBoolean(rawValue, rules.canh_bao_cc_don_le)
        break
      case 'ty_le_dat_clo_canh_bao':
        rules.ty_le_dat_clo_canh_bao = parseNumber(rawValue) ?? rules.ty_le_dat_clo_canh_bao
        break
      default:
        continue
    }
  }

  return rules
}

export function parseQuyTacSheet(wb: ExcelJS.Workbook): BusinessRules {
  const ws = findSheet(wb, 'QUY_TAC')
  if (!ws) return { ...DEFAULT_BUSINESS_RULES }

  const { headers, rows } = readTable(ws, CONFIG_SHEET_COLUMNS.QUY_TAC, 'QUY_TAC')
  return parseBusinessRules(ws, headers, rows)
}
