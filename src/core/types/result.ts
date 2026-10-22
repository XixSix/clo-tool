/**
 * Data Models: KẾT QUẢ TÍNH ĐIỂM (OUTPUT TRACEABILITY)
 * Quy chuẩn: Đại học Thành Đông (QĐ 450/QĐ-ĐHTĐ ngày 07/8/2024)
 *
 * Lưu ý: File này độc lập 100%, không import bất kỳ package nào từ Electron hoặc React.
 */

import type { AssessmentGroup, CourseConfig } from './course'

// ==========================================
// 1. ĐIỂM CHI TIẾT TỪNG Ô & NHÓM
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

// ==========================================
// 2. KẾT QUẢ TỪNG SINH VIÊN
// ==========================================

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

// ==========================================
// 3. THỐNG KÊ TỔNG HỢP TOÀN LỚP
// ==========================================

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
