/**
 * Tập 8/12 Quyết định nghiệp vụ (mục VII của đặc tả) coi là giá trị mặc định
 * của bảng QUY_TAC trong file Config.
 * Quy chuẩn: Đại học Thành Đông (QĐ 450/QĐ-ĐHTĐ)
 */

import type { AttendanceRule, BusinessRules } from '../types'

/** Quy đổi ký hiệu điểm danh mặc định; sau này đưa vào Settings của ứng dụng. */
export const DEFAULT_ATTENDANCE_RULES: AttendanceRule[] = [
  { kyHieu: 'X', heSo: 1, dienGiai: 'Có mặt đúng giờ' },
  { kyHieu: 'OL', heSo: 1, dienGiai: 'Học online có mặt' },
  { kyHieu: 'M', heSo: 0.5, dienGiai: 'Đi muộn hoặc về sớm' },
  { kyHieu: 'V-CP', heSo: 0.5, dienGiai: 'Vắng có phép' },
  { kyHieu: 'V', heSo: 0, dienGiai: 'Vắng không phép' }
]

export const DEFAULT_BUSINESS_RULES: BusinessRules = {
  phuongThucTinhHp: 'QD450',
  nguongDatClo: 4.0,
  nguongDatPlo: 4.0,
  nguongDatHp: 4.0,
  cachTinhCloBoPhan: 'mean_of_ratios',
  cheDoLamTron: 'chain',
  tinhSvVangThi: true,
  canhBaoCcDonLe: true,
  tyLeNhom27: 0.27,
  nguongCoMauN: 30,
  tyLeDatCloCanhBao: 50
}
