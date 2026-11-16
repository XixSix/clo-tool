/**
 * Data Models: QUY TẮC NGHIỆP VỤ & ĐIỂM DANH (BUSINESS RULES & ATTENDANCE RULES)
 * Quy chuẩn: Đại học Thành Đông (QĐ 450/QĐ-ĐHTĐ ngày 07/8/2024)
 */

export interface AttendanceRule {
  kyHieu: string
  heSo: number
  dienGiai?: string
}

/** Quy tắc tính điểm của model Course mới. */
export interface BusinessRules {
  phuongThucTinhHp: 'QD450' | 'RAW_POINTS' // Mặc định: QD450
  nguongDatClo: number // Mặc định: 4.0 (Quyết định #2)
  nguongDatPlo: number // Mặc định: 4.0 (QĐ450 Điều 10)
  nguongDatHp: number // Mặc định: 4.0
  cachTinhCloBoPhan: 'mean_of_ratios' | 'ratio_of_sums' // Mặc định: mean_of_ratios (Quyết định #3)
  cheDoLamTron: 'chain' | 'final_only' // Mặc định: chain (Quyết định #4)
  tinhSvVangThi: boolean // Mặc định: true (Quyết định #5)
  canhBaoCcDonLe: boolean // Mặc định: true (Quyết định #7)
  tyLeNhom27: number // Mặc định: 0.27 (27%)
  nguongCoMauN: number // Mặc định: 30
  tyLeDatCloCanhBao: number // Mặc định: 50 (% SV đạt CLO dưới ngưỡng này thì tô cảnh báo)
}
