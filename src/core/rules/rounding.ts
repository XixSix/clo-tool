/**
 * Số học chính xác cao với decimal.js.
 * Quy chuẩn: Đại học Thành Đông (QĐ 450/QĐ-ĐHTĐ)
 *
 * Toàn bộ công cụ tính điểm PHẢI đi qua các hàm ở đây — tuyệt đối không dùng
 * số học float thường (test golden T1–T12 dễ phát hiện sai số).
 */

import Decimal from 'decimal.js'

// Cấu hình decimal.js toàn cục chế độ làm tròn nửa lên (ROUND_HALF_UP)
// và độ chính xác 20 chữ số cho các phép tính trung gian
Decimal.set({
  precision: 20,
  rounding: Decimal.ROUND_HALF_UP
})

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
