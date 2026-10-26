/**
 * Validate sheet DIEM_DANH — bảng chuyển ký hiệu điểm danh sang hệ số.
 */

import type { CourseConfig, ValidationIssue } from '../types'

export function validateDiemDanh(config: CourseConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  if (!config.diemDanh) return issues

  const seen = new Set<string>()
  for (const rule of config.diemDanh) {
    if (!rule.kyHieu || rule.kyHieu.trim() === '') {
      issues.push({
        level: 'error',
        sheet: 'DIEM_DANH',
        column: 'Ky_Hieu',
        message: 'Ký hiệu điểm danh không được trống.'
      })
      continue
    }

    if (seen.has(rule.kyHieu)) {
      issues.push({
        level: 'error',
        sheet: 'DIEM_DANH',
        column: 'Ky_Hieu',
        message: `Ký hiệu điểm danh "${rule.kyHieu}" bị lặp.`
      })
    }
    seen.add(rule.kyHieu)

    if (!Number.isFinite(rule.heSo) || rule.heSo < 0 || rule.heSo > 1) {
      issues.push({
        level: 'error',
        sheet: 'DIEM_DANH',
        column: 'He_So',
        message: `Hệ số của ký hiệu "${rule.kyHieu}" phải trong khoảng [0, 1] (nhận ${rule.heSo}).`
      })
    }
  }

  return issues
}
