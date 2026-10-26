/**
 * Validate sheet QUY_TAC — luật nghiệp vụ toàn cục (Quyết định #1–#9).
 * Giá trị lạ phải báo lỗi thay vì để engine lặng lẽ rơi về mặc định.
 */

import type { BusinessRules, CourseConfig, ValidationIssue } from '../types'

const HP_METHODS = new Set(['QD450', 'RAW_POINTS'])
const CLO_BO_PHAN = new Set(['mean_of_ratios', 'ratio_of_sums'])
const ROUNDING_MODES = new Set(['chain', 'final_only'])

export function validateQuyTac(config: CourseConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const rules: BusinessRules = config.quyTac

  if (!HP_METHODS.has(rules.hp_method)) {
    issues.push({
      level: 'error',
      sheet: 'QUY_TAC',
      column: 'hp_method',
      message: `quyTac.hp_method "${rules.hp_method}" không hợp lệ (QD450 / RAW_POINTS).`
    })
  }

  if (!CLO_BO_PHAN.has(rules.clo_bo_phan)) {
    issues.push({
      level: 'error',
      sheet: 'QUY_TAC',
      column: 'clo_bo_phan',
      message: `quyTac.clo_bo_phan "${rules.clo_bo_phan}" không hợp lệ (mean_of_ratios / ratio_of_sums).`
    })
  }

  if (!ROUNDING_MODES.has(rules.rounding_mode)) {
    issues.push({
      level: 'error',
      sheet: 'QUY_TAC',
      column: 'rounding_mode',
      message: `quyTac.rounding_mode "${rules.rounding_mode}" không hợp lệ (chain / final_only).`
    })
  }

  // Ngưỡng "đạt" thang điểm 10: 0 ≤ ngưỡng ≤ 10
  const thresholds: Array<[keyof BusinessRules, number]> = [
    ['nguong_dat_clo', rules.nguong_dat_clo],
    ['nguong_dat_plo', rules.nguong_dat_plo],
    ['nguong_dat_hp', rules.nguong_dat_hp]
  ]
  for (const [key, value] of thresholds) {
    if (!Number.isFinite(value) || value < 0 || value > 10) {
      issues.push({
        level: 'error',
        sheet: 'QUY_TAC',
        column: key,
        message: `${key} = ${value} không hợp lệ — ngưỡng đạt phải trong khoảng [0, 10].`
      })
    }
  }

  if (!Number.isFinite(rules.ty_le_nhom_27) || rules.ty_le_nhom_27 < 0 || rules.ty_le_nhom_27 > 1) {
    issues.push({
      level: 'error',
      sheet: 'QUY_TAC',
      column: 'ty_le_nhom_27',
      message: `ty_le_nhom_27 = ${rules.ty_le_nhom_27} không hợp lệ — phải là tỷ lệ trong khoảng [0, 1].`
    })
  }

  if (!Number.isFinite(rules.nguong_co_mau_n) || rules.nguong_co_mau_n < 0) {
    issues.push({
      level: 'error',
      sheet: 'QUY_TAC',
      column: 'nguong_co_mau_n',
      message: `nguong_co_mau_n = ${rules.nguong_co_mau_n} không hợp lệ — phải là số nguyên dương hoặc 0.`
    })
  }

  if (
    !Number.isFinite(rules.ty_le_dat_clo_canh_bao) ||
    rules.ty_le_dat_clo_canh_bao < 0 ||
    rules.ty_le_dat_clo_canh_bao > 100
  ) {
    issues.push({
      level: 'error',
      sheet: 'QUY_TAC',
      column: 'ty_le_dat_clo_canh_bao',
      message: `ty_le_dat_clo_canh_bao = ${rules.ty_le_dat_clo_canh_bao} không hợp lệ — phải trong khoảng [0, 100].`
    })
  }

  return issues
}
