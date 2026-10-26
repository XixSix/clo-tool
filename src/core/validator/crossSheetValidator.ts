/**
 * Validate chéo giữa các sheet (KE_HOACH ↔ CAU_HOI ↔ CLO_LIST ↔ MA_TRAN_PLO).
 */

import type { CourseConfig, ValidationIssue } from '../types'
import { EPSILON, examMaxScores } from './helpers'
import { roundHalfUp } from '../rules'

export function validateCrossSheet(config: CourseConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  // 1. Mã CLO phải tồn tại trong CLO_LIST (từ cả 3 sheet tham chiếu)
  const cloCodes = new Set(config.cloList.map((c) => c.maClo))
  const checkClo = (clo: string, sheet: string, row?: number): void => {
    if (clo && !cloCodes.has(clo)) {
      issues.push({
        level: 'error',
        sheet,
        row,
        column: 'CLO',
        message: `Mã CLO "${clo}" không có trong sheet CLO_LIST.`
      })
    }
  }
  config.keHoachDanhGia.forEach((p, idx) => checkClo(p.clo, 'KE_HOACH_DANH_GIA', idx + 2))
  config.cauHoi.forEach((q, idx) => checkClo(q.clo, 'CAU_HOI', idx + 2))
  config.maTranPlo.forEach((m, idx) => checkClo(m.clo, 'MA_TRAN_PLO', idx + 2))

  // 2. Cặp (đầu điểm, CLO) phải khớp 2 chiều giữa KE_HOACH_DANH_GIA và CAU_HOI
  const planKeys = new Set(config.keHoachDanhGia.map((p) => `${p.maDauDiem}|${p.clo}`))
  const questionKeys = new Set(config.cauHoi.map((q) => `${q.maDauDiem}|${q.clo}`))

  for (const key of questionKeys) {
    if (!planKeys.has(key)) {
      const [maDauDiem, clo] = key.split('|')
      issues.push({
        level: 'error',
        sheet: 'CAU_HOI',
        message: `Cặp đầu điểm "${maDauDiem}" – CLO "${clo}" có trong CAU_HOI nhưng không có trong KE_HOACH_DANH_GIA.`
      })
    }
  }
  for (const key of planKeys) {
    if (!questionKeys.has(key)) {
      const [maDauDiem, clo] = key.split('|')
      issues.push({
        level: 'error',
        sheet: 'KE_HOACH_DANH_GIA',
        message: `Cặp đầu điểm "${maDauDiem}" – CLO "${clo}" có trong kế hoạch nhưng không có cột điểm tương ứng trong CAU_HOI.`
      })
    }
  }

  // 3. CLO không được đầu điểm nào đo
  const measuredClo = new Set(config.keHoachDanhGia.map((p) => p.clo))
  for (const clo of config.cloList) {
    if (clo.maClo && !measuredClo.has(clo.maClo)) {
      issues.push({
        level: 'error',
        sheet: 'CLO_LIST',
        message: `CLO "${clo.maClo}" không được đầu điểm nào đo.`
      })
    }
  }

  // 4. Tổng điểm tối đa mỗi đề phải bằng 10
  for (const [key, total] of Object.entries(examMaxScores(config.cauHoi))) {
    if (Math.abs(total - 10) > EPSILON) {
      const [maDauDiem, maDe] = key.split('|')
      issues.push({
        level: 'error',
        sheet: 'CAU_HOI',
        message: `Tổng điểm tối đa của đề ${maDauDiem}/${maDe} = ${roundHalfUp(total, 2)}, phải bằng 10.`
      })
    }
  }

  return issues
}
