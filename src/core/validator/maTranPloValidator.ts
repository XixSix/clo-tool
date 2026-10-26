/**
 * Validate sheet MA_TRAN_PLO — ma trận ánh xạ PLO/PI ↔ CLO.
 */

import type { CourseConfig, ValidationIssue } from '../types'

export function validateMaTranPlo(config: CourseConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const seen = new Set<string>()

  for (const m of config.maTranPlo) {
    if (!m.plo || m.plo.trim() === '') {
      issues.push({ level: 'error', sheet: 'MA_TRAN_PLO', column: 'PLO', message: 'Thiếu mã PLO.' })
    }
    if (!m.pi || m.pi.trim() === '') {
      issues.push({ level: 'error', sheet: 'MA_TRAN_PLO', column: 'PI', message: 'Thiếu mã PI.' })
    }

    const key = `${m.plo}|${m.pi}|${m.clo}`
    if (seen.has(key)) {
      issues.push({
        level: 'error',
        sheet: 'MA_TRAN_PLO',
        message: `Ánh xạ (PLO "${m.plo}", PI "${m.pi}", CLO "${m.clo}") bị lặp làm trùng lặp dữ liệu.`
      })
    }
    seen.add(key)
  }

  return issues
}
