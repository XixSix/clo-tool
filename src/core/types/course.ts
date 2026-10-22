/**
 * Data Models: CẤU HÌNH HỌC PHẦN (COURSE CONFIG INPUT)
 * Quy chuẩn: Đại học Thành Đông (QĐ 450/QĐ-ĐHTĐ ngày 07/8/2024)
 *
 * Lưu ý: File này độc lập 100%, không import bất kỳ package nào từ Electron hoặc React.
 */

export interface CourseInfo {
  maHp: string
  tenHp: string
  soTinChi: number
  hinhThucThi: string
  loaiHp: 'thuong' | 'thuc_hanh'
}

export interface CLODefinition {
  maClo: string
  noiDung: string
  bacNangLuc: string // e.g. "3/6", "3/5", "4/6"
  trongSoClo?: number // default 1 (dùng cho TBC CLO hoặc HP thực hành)
}

export type AssessmentGroup = 'CC' | 'GK' | 'CK'

export interface EvaluationPlanItem {
  nhom: AssessmentGroup
  thanhPhan: string
  maDauDiem: string
  clo: string
  trongSoPhanTram: number // e.g. 10 (tổng toàn kế hoạch phải = 100%)
  hinhThuc?: string
  thoiDiem?: string
}

export interface QuestionColumn {
  maCotDiem: string
  maDauDiem: string
  cau: string // e.g. "Câu 1", "Câu 3" (để gộp ý 3a, 3b khi tính psychometrics)
  clo: string
  diemToiDa: number
  maDe?: string // default "ALL"
  loai?: 'TL' | 'TN'
}

export interface PLOMapping {
  plo: string
  pi: string
  clo: string
}

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

export interface CourseConfig {
  courseInfo: CourseInfo
  cloList: CLODefinition[]
  keHoachDanhGia: EvaluationPlanItem[]
  cauHoi: QuestionColumn[]
  maTranPlo: PLOMapping[]
  diemDanh?: AttendanceRule[]
  quyTac: BusinessRules
}
