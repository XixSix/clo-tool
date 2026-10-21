/**
 * Data Models & Interfaces cho Core Engine
 * Quy chuẩn: Đại học Thành Đông (QĐ 450/QĐ-ĐHTĐ ngày 07/8/2024)
 *
 * Lưu ý: File này độc lập 100%, không import bất kỳ package nào từ Electron hoặc React.
 */

// ==========================================
// 1. CẤU HÌNH HỌC PHẦN (COURSE CONFIG INPUT)
// ==========================================

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

// ==========================================
// 2. DỮ LIỆU ĐIỂM THÔ SINH VIÊN (RAW INPUT)
// ==========================================

export interface RawStudentRow {
  tt: number
  maSv: string
  hoTen: string
  ngaySinh?: string
  maDe?: string
  diemCacCot: Record<string, number | 'VT' | null | undefined>
  ghiChu?: string
}

// ==========================================
// 3. KẾT QUẢ TÍNH ĐIỂM (OUTPUT TRACEABILITY)
// ==========================================

export interface CellScoreDetail {
  maDauDiem: string
  maClo: string
  score: number // Thang 10, đã áp dụng rounding_mode
  rawScore: number // Điểm chưa làm tròn
  columnCodes: string[]
  totalEarned: number
  totalMax: number
  itemRatios: number[]
}

export interface GroupScoreDetail {
  nhom: AssessmentGroup
  score: number // Thang 10, TBC các CLO của nhóm đó (C_cc, C_gk, C_ck)
  cloCodes: string[]
  cloScores: Record<string, number>
  rawGroupScore?: number // Điểm thô của nhóm (nếu tính theo phương thức RAW_POINTS)
}

export interface ProcessedStudentResult {
  tt: number
  maSv: string
  hoTen: string
  ngaySinh?: string
  maDe?: string

  // Chi tiết từng ô (đầu điểm, CLO) -> Full Traceability
  cellScores: Record<string, CellScoreDetail> // key dạng `${maDauDiem}_${maClo}`

  // Điểm CLO thành phần từng đợt
  processCloScores: Record<string, number> // Bảng quá trình (CC + GK)
  finalCloScores: Record<string, number> // Bảng cuối kỳ (CK)

  // Điểm CLO cả học phần (thang 10)
  cloScores: Record<string, number>

  // Điểm các nhóm đánh giá (C_cc, C_gk, C_ck)
  groupScores: Record<AssessmentGroup, GroupScoreDetail>

  // Điểm trung bình cộng CLO (Phụ lục 3)
  tbcClo: number
  tbcCloInWords: string // Đọc số thành chữ (ví dụ: "Sáu phẩy sáu")
  tbQuaTrinh?: number // (C_cc + C_gk) / 2 (ví dụ Hùng = 7,8)

  // Điểm học phần
  courseScore: number // Điểm chính thức theo quy tắc hp_method
  courseScoreQd450: number // Điểm theo QĐ450 Điều 9.3 (ví dụ Hùng = 6,7)
  courseScoreRawPoints: number // Điểm theo phương thức cũ RAW_POINTS (ví dụ Hùng = 6,9)
  scoreDifferenceWarning?: string // Cảnh báo nếu lệch >= 0.1 giữa 2 phương thức

  // Điểm PLO thành phần
  ploScores: Record<string, number>

  // Trạng thái & Cảnh báo
  isPassedHp: boolean
  isAbsentFinal: boolean
  hasMissingData: boolean
  warnings: string[]
}

export interface CloStat {
  maClo: string
  passedCount: number
  passedPercent: number
  failedCount: number
  failedPercent: number
  mean: number
  min: number
  max: number
  isBelowThreshold: boolean
}

export interface PloStat {
  plo: string
  passedCount: number
  passedPercent: number
  failedCount: number
  failedPercent: number
  mean: number
}

export interface ClassEvaluationSummary {
  totalStudents: number
  evaluatedStudents: number
  absentStudents: number
  missingDataStudents: number
  cloStats: Record<string, CloStat>
  ploStats: Record<string, PloStat>
  courseStat: {
    passedCount: number
    passedPercent: number
    failedCount: number
    failedPercent: number
    mean: number
    min: number
    max: number
  }
  generalWarnings: string[]
}

export interface EvaluationResult {
  students: ProcessedStudentResult[]
  summary: ClassEvaluationSummary
  config: CourseConfig
}

// ==========================================
// 4. KIỂM ĐỊNH ĐỀ THI (PSYCHOMETRICS)
// ==========================================

export type DifficultyLevel = 'Rất khó' | 'Khó' | 'Tương đối khó' | 'Trung bình' | 'Dễ'
export type DiscriminationLevel = 'Nên loại bỏ' | 'Yếu' | 'Đủ độ phân biệt' | 'Tốt' | 'Rất tốt'
export type ReliabilityLevel = 'Không đủ độ tin cậy' | 'Yếu' | 'Đủ độ tin cậy' | 'Cao' | 'Rất cao'

export interface ItemPsychometrics {
  cau: string
  diemToiDa: number
  diemTrungBinh: number
  doKhoP: number
  mucDoKho: DifficultyLevel
  doPhanBietD: number
  mucDoPhanBiet: DiscriminationLevel
  alphaNeuBoCau: number
  canhBao?: string // e.g. "d < 0: Nên loại bỏ câu này" hoặc "p < 0.2: Câu rất khó"
}

export interface ExamPsychometrics {
  maDauDiem: string
  maDe: string
  soSinhVien: number
  soCauHoi: number
  items: ItemPsychometrics[]
  cronbachAlpha: number
  mucDoTinCay: ReliabilityLevel
  tongPhuongSaiCau: number
  phuongSaiTongDiem: number
  canhBaoCoMauN?: string // In cảnh báo khi N < 30 hoặc nhóm 27% < 5 SV
}
