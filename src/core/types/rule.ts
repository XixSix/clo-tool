/**
 * Data Models: QUY TẮC NGHIỆP VỤ & ĐIỂM DANH (BUSINESS RULES & ATTENDANCE RULES)
 * Quy chuẩn: Đại học Thành Đông (QĐ 450/QĐ-ĐHTĐ ngày 07/8/2024)
 */

export interface AttendanceRule {
  kyHieu: string
  heSo: number
  dienGiai?: string
}

export interface BusinessRules {
  hp_method: 'QD450' | 'RAW_POINTS' // Mặc định: QD450
  nguong_dat_clo: number // Mặc định: 4.0 (Quyết định #2)
  nguong_dat_plo: number // Mặc định: 4.0 (QĐ450 Điều 10)
  nguong_dat_hp: number // Mặc định: 4.0
  clo_bo_phan: 'mean_of_ratios' | 'ratio_of_sums' // Mặc định: mean_of_ratios (Quyết định #3)
  rounding_mode: 'chain' | 'final_only' // Mặc định: chain (Quyết định #4)
  tinh_sv_vang_thi: boolean // Mặc định: true (Quyết định #5)
  canh_bao_cc_don_le: boolean // Mặc định: true (Quyết định #7)
  ty_le_nhom_27: number // Mặc định: 0.27 (27%)
  nguong_co_mau_n: number // Mặc định: 30
  ty_le_dat_clo_canh_bao: number // Mặc định: 50 (% SV đạt CLO dưới ngưỡng này thì tô cảnh báo)
}
