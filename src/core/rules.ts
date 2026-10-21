/**
 * Business Rules & Xử lý số học chính xác cao
 * Quy chuẩn: Đại học Thành Đông (QĐ 450/QĐ-ĐHTĐ)
 *
 * Sử dụng decimal.js với chế độ ROUND_HALF_UP để đảm bảo tuyệt đối không có sai số nhị phân.
 */

import Decimal from 'decimal.js'
import type { BusinessRules, DifficultyLevel, DiscriminationLevel, ReliabilityLevel } from './types'

// Cấu hình decimal.js toàn cục chế độ làm tròn nửa lên (ROUND_HALF_UP)
// và độ chính xác 20 chữ số cho các phép tính trung gian
Decimal.set({
  precision: 20,
  rounding: Decimal.ROUND_HALF_UP
})

/**
 * 8 Quyết định nghiệp vụ đã chốt ở Mục VII của đặc tả
 */
export const DEFAULT_BUSINESS_RULES: BusinessRules = {
  hp_method: 'QD450',
  nguong_dat_clo: 4.0,
  nguong_dat_plo: 4.0,
  nguong_dat_hp: 4.0,
  clo_bo_phan: 'mean_of_ratios',
  rounding_mode: 'chain',
  tinh_sv_vang_thi: true,
  canh_bao_cc_don_le: true,
  ty_le_nhom_27: 0.27,
  nguong_co_mau_n: 30
}

/**
 * Làm tròn nửa lên (ROUND_HALF_UP) bằng decimal.js.
 * Khớp chuẩn QĐ450: 6.25 -> 6.3, 8.75 -> 8.8, 7.75 -> 7.8, 5.75 -> 5.8
 */
export function roundHalfUp(val: number | string | Decimal, decimals = 1): number {
  if (val === null || val === undefined || Number.isNaN(Number(val))) {
    return 0
  }
  const d = new Decimal(val)
  return d.toDecimalPlaces(decimals, Decimal.ROUND_HALF_UP).toNumber()
}

/**
 * Hỗ trợ làm tròn theo chế độ:
 * - 'chain': làm tròn từng bước dùng cho cấp tiếp theo (mặc định)
 * - 'final_only': giữ số gốc, không làm tròn ở bước trung gian
 */
export function roundStep(
  val: number,
  mode: 'chain' | 'final_only' = 'chain',
  decimals = 1
): number {
  if (mode === 'chain') {
    return roundHalfUp(val, decimals)
  }
  return val
}

/**
 * Phân loại độ khó p (QĐ450 Điều 5.1):
 * - >= 0.8: Dễ
 * - 0.6 - < 0.8: Trung bình
 * - 0.4 - < 0.6: Tương đối khó
 * - 0.2 - < 0.4: Khó
 * - < 0.2: Rất khó
 */
export function classifyDifficulty(p: number): DifficultyLevel {
  const d = new Decimal(p)
  if (d.gte(0.8)) return 'Dễ'
  if (d.gte(0.6)) return 'Trung bình'
  if (d.gte(0.4)) return 'Tương đối khó'
  if (d.gte(0.2)) return 'Khó'
  return 'Rất khó'
}

/**
 * Phân loại độ phân biệt d (QĐ450 Điều 5.2):
 * - 0.7 <= d <= 1.0: Rất tốt
 * - 0.4 <= d < 0.7: Tốt
 * - 0.2 <= d < 0.4: Đủ độ phân biệt
 * - 0 <= d < 0.2: Yếu
 * - < 0: Nên loại bỏ
 */
export function classifyDiscrimination(d: number): DiscriminationLevel {
  const dec = new Decimal(d)
  if (dec.gte(0.7)) return 'Rất tốt'
  if (dec.gte(0.4)) return 'Tốt'
  if (dec.gte(0.2)) return 'Đủ độ phân biệt'
  if (dec.gte(0)) return 'Yếu'
  return 'Nên loại bỏ'
}

/**
 * Phân loại độ tin cậy Cronbach's alpha (QĐ450 Điều 5.3):
 * - >= 0.85: Rất cao
 * - 0.80 - < 0.85: Cao
 * - 0.70 - < 0.80: Đủ độ tin cậy
 * - 0.60 < alpha < 0.70: Yếu
 * - <= 0.60: Không đủ độ tin cậy
 */
export function classifyReliability(alpha: number): ReliabilityLevel {
  const a = new Decimal(alpha)
  if (a.gte(0.85)) return 'Rất cao'
  if (a.gte(0.8)) return 'Cao'
  if (a.gte(0.7)) return 'Đủ độ tin cậy'
  if (a.gt(0.6)) return 'Yếu'
  return 'Không đủ độ tin cậy'
}
