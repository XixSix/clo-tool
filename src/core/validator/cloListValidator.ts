/**
 * Validate sheet CLO_LIST — danh mục chuẩn đầu ra (CLO).
 */

import type { CourseConfig, ValidationIssue } from '../types'

// Chấp nhận cả dạng phân cấp CLOx.y (ví dụ CLO1.1) theo QĐ450
const CLO_CODE_PATTERN = /^CLO\d+(\.\d+)?$/

export function validateCloList(config: CourseConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  // Validate all sheet
  if (config.cloList.length === 0) {
    issues.push({ level: 'error', sheet: 'CLO_LIST', message: 'Chưa khai báo CLO nào.' })
  }

  const seen = new Set<string>()
  for (const clo of config.cloList) {
    // Validate Ma_CLO
    if (!clo.maClo || clo.maClo.trim() === '') {
      issues.push({ 
        level: 'error', 
        sheet: 'CLO_LIST', 
        column: 'Ma_CLO', 
        message: 'Thiếu Mã CLO.' 
      })
      continue
    }

    if (!CLO_CODE_PATTERN.test(clo.maClo)) {
      issues.push({
        level: 'error',
        sheet: 'CLO_LIST',
        column: 'Ma_CLO',
        message: `Mã CLO "${clo.maClo}" phải theo dạng CLOx hoặc CLOx.y (ví dụ CLO1, CLO2, CLO1.1).`
      })
    }

    if (seen.has(clo.maClo)) {
      issues.push({
        level: 'error',
        sheet: 'CLO_LIST',
        column: 'Ma_CLO',
        message: `Mã CLO "${clo.maClo}" bị lặp.`
      })
    }
    seen.add(clo.maClo)

    // Validate Trong_so_CLO
    if (
      clo.trongSoClo !== undefined &&
      (!Number.isFinite(clo.trongSoClo) || clo.trongSoClo <= 0 || clo.trongSoClo > 100)
    ) {
      issues.push({
        level: 'error',
        sheet: 'CLO_LIST',
        column: 'Trong_So_CLO',
        message: `Trọng số CLO của "${clo.maClo}" phải thuộc (0..100].`
      })
    }

    // Validate Noi_dung
    if (!clo.noiDung || clo.noiDung.trim() === '') {
      issues.push({
        level: 'warning',
        sheet: 'CLO_LIST',
        column: 'Noi_Dung',
        message: `CLO "${clo.maClo}" thiếu nội dung (Noi_Dung).`
      })
    }
  }

  return issues
}
