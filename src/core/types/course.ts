/**
 * Data Models: HỌC PHẦN VÀ KẾ HOẠCH ĐÁNH GIÁ
 * Quy chuẩn: Đại học Thành Đông (QĐ 450/QĐ-ĐHTĐ ngày 07/8/2024)
 *
 */

import type { BusinessRules } from './rule'

/** Loại học phần: học phần thường hoặc học phần thực hành. */
export type CourseType = 'thuong' | 'thuc_hanh'

/** Nhóm đánh giá chuẩn: chuyên cần, giữa kỳ, cuối kỳ. */
export type AssessmentGroup = 'CC' | 'GK' | 'CK'

export interface PLO {
  id: string
  maPlo: string
  noiDung: string
  ploThanhPhanIds: string[]
}

export interface PartialPLO {
  id: string
  maPloThanhPhan: string
  maPlo: string
  noiDung: string
  piIds: string[]
}

export interface PerformanceIndicator {
  id: string
  maPi: string
  noiDung: string
  ploThanhPhanIds: string[]
  cloIds: string[]
}

/** Chuẩn đầu ra học phần. */
export interface CourseLearningOutcome {
  id: string
  maClo: string
  noiDung: string
  bacNangLuc?: string
  /** Chỉ dùng cho học phần thuc_hanh; tổng các trọng số phải bằng 100%. */
  trongSoClo?: number
}

/** Cách nhập dữ liệu của một đợt đánh giá. */
export type AssessmentInputMode =
  | 'QUESTION_SCORE' // Nhập theo câu hỏi
  | 'DIRECT_CLO_SCORE' // Nhập trực tiếp
  | 'ATTENDANCE' // Nhập theo điểm danh

/** Ánh xạ một CLO vào đợt đánh giá và tỷ lệ phân bổ nội bộ của đợt. */
export interface AssessmentCLOMapping {
  cloId: string
  tyLePhanBo: number
}

/** Một câu hỏi thuộc một mã đề; mỗi câu đo một CLO. */
export interface ExamQuestion {
  id: string
  cau: number | string
  diemToiDa: number
  cloId: string
  loai?: 'TL' | 'TN'
}

/** Một mã đề thuộc một đợt đánh giá. */
export interface ExamVariant {
  id: string
  maDe: string
  cauHoi: ExamQuestion[]
}

/** Một buổi điểm danh thuộc một đợt chuyên cần. */
export interface AssessmentAttendanceSession {
  id: string
  tenBuoi: string
  ngay?: string
}

/** Một đợt đánh giá, gom trọng số, CLO, mã đề và câu hỏi. */
export interface AssessmentComponent {
  id: string
  tenDotDanhGia: string
  nhom: AssessmentGroup
  cachNhapDiem: AssessmentInputMode
  /** Trọng số của đợt trong toàn bộ kế hoạch; tổng các đợt = 100%. */
  trongSoPhanTram: number
  /** Danh sách CLO đợt này đánh giá; tổng tỷ lệ phân bổ trong đợt = 100%. */
  cloList: AssessmentCLOMapping[]
  maDeList: ExamVariant[]
  buoiDiemDanh?: AssessmentAttendanceSession[]
}

/** Model học phần nghiệp vụ mới, dùng khi chuyển khỏi cấu trúc sheet phẳng. */
export interface Course {
  id: string
  maHp: string
  tenHp: string
  soTinChi: number
  hinhThucThi: string
  loaiHp: CourseType
  /** Giảng viên phụ trách học phần. */
  giangVien?: string
  /** Năm học, ví dụ "2024-2025". */
  namHoc?: string
  cloList: CourseLearningOutcome[]
  ploList: PLO[]
  ploThanhPhanList: PartialPLO[]
  piList: PerformanceIndicator[]
  /** Các đợt đánh giá; tổng trongSoPhanTram của danh sách = 100%. */
  dotDanhGia: AssessmentComponent[]
  quyTac: BusinessRules
}
