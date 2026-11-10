/**
 * Validate chéo giữa các sheet (KE_HOACH ↔ CAU_HOI ↔ CLO_LIST ↔ MA_TRAN_PLO).
 */

import type {
  CLODefinition,
  EvaluationPlanItem,
  PLOMapping,
  QuestionColumn,
  ValidationIssue
} from '../../types'
import { EPSILON, examMaxScores } from '../helpers'
import { roundHalfUp } from '../../rules'

export function validateCrossSheet(
  cloList: CLODefinition[],
  keHoachDanhGia: EvaluationPlanItem[],
  cauHoi: QuestionColumn[],
  maTranPlo: PLOMapping[]
): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  // 1. Mã CLO phải tồn tại trong CLO_LIST (từ cả 3 sheet tham chiếu)
  const cloCodes = new Set(cloList.map((c) => c.maClo.trim()))
  const checkClo = (clo: string, sheet: string, row?: number): void => {
    const code = clo?.trim()
    if (code && !cloCodes.has(code)) {
      issues.push({
        level: 'error',
        sheet,
        row,
        column: 'CLO',
        message: `Mã CLO "${code}" không có trong sheet CLO_LIST.`
      })
    }
  }
  keHoachDanhGia.forEach((p, idx) => checkClo(p.clo, 'KE_HOACH_DANH_GIA', idx + 2))
  cauHoi.forEach((q, idx) => checkClo(q.clo, 'CAU_HOI', idx + 2))
  maTranPlo.forEach((m, idx) => checkClo(m.clo, 'MA_TRAN_PLO', idx + 2))

  // 2. Cặp (đầu điểm, CLO) phải khớp 2 chiều giữa KE_HOACH_DANH_GIA và CAU_HOI
  // Trim mã trước khi so khớp để khoảng trắng thừa không tạo cặp "khác nhau".
  const pairKey = (maDauDiem: string, clo: string): string => `${maDauDiem.trim()}|${clo.trim()}`
  const planKeys = new Set(keHoachDanhGia.map((p) => pairKey(p.maDauDiem, p.clo)))
  const questionKeys = new Set(cauHoi.map((q) => pairKey(q.maDauDiem, q.clo)))

  for (const key of questionKeys) {
    if (!planKeys.has(key)) {
      const [maDauDiem, clo] = key.split('|')
      issues.push({
        level: 'warning',
        sheet: 'CAU_HOI',
        message: `Cặp đầu điểm "${maDauDiem}" – CLO "${clo}" có trong CAU_HOI nhưng không có trong KE_HOACH_DANH_GIA.`
      })
    }
  }
  for (const key of planKeys) {
    if (!questionKeys.has(key)) {
      const [maDauDiem, clo] = key.split('|')
      issues.push({
        level: 'warning',
        sheet: 'KE_HOACH_DANH_GIA',
        message: `Cặp đầu điểm "${maDauDiem}" – CLO "${clo}" có trong kế hoạch nhưng không có cột điểm tương ứng trong CAU_HOI (sẽ dùng cột điểm trực tiếp "${maDauDiem}" thang 10 nếu có).`
      })
    }
  }

  // 3. CLO không được đầu điểm nào đo
  const measuredClo = new Set(keHoachDanhGia.map((p) => p.clo.trim()))
  for (const clo of cloList) {
    const code = clo.maClo.trim()
    if (code && !measuredClo.has(code)) {
      issues.push({
        level: 'error',
        sheet: 'CLO_LIST',
        message: `CLO "${code}" không được đầu điểm nào đo.`
      })
    }
  }

  // 4. CLO chưa được ánh xạ tới PI/PLO (đối chiếu CLO_LIST với MA_TRAN_PLO)
  const mappedClo = new Set(maTranPlo.map((m) => m.clo.trim()))
  for (const clo of cloList) {
    const code = clo.maClo.trim()
    if (code && !mappedClo.has(code)) {
      issues.push({
        level: 'warning',
        sheet: 'MA_TRAN_PLO',
        message: `CLO "${code}" chưa được ánh xạ tới PI/PLO nào.`
      })
    }
  }

  // 5. Tổng điểm tối đa mỗi đề phải bằng 10
  for (const [key, total] of Object.entries(examMaxScores(cauHoi))) {
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
