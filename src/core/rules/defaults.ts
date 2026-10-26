/**
 * Tập 8/12 Quyết định nghiệp vụ (mục VII của đặc tả) coi là giá trị mặc định
 * của bảng QUY_TAC trong file Config.
 * Quy chuẩn: Đại học Thành Đông (QĐ 450/QĐ-ĐHTĐ)
 */

import type { BusinessRules } from '../types'

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
  nguong_co_mau_n: 30,
  ty_le_dat_clo_canh_bao: 50
}
