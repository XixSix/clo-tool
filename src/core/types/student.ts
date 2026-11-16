/**
 * Data Models: SINH VIÊN VÀ DỮ LIỆU NHẬP ĐIỂM
 * Quy chuẩn: Đại học Thành Đông (QĐ 450/QĐ-ĐHTĐ ngày 07/8/2024)
 *
 */

import type { AssessmentInputMode } from './course'

/** Thông tin định danh của sinh viên. */
export interface Student {
  id: string
  tt: number
  maSv: string
  ho: string
  ten: string
  hoTen: string
  ngaySinh?: string
}

/** Giá trị điểm nhập; null = ô trống, VT = vắng thi. */
export type ScoreValue = number | 'VT' | null

/** Điểm của một câu hỏi trong một đợt đánh giá. */
export interface StudentQuestionScore {
  questionId: string
  diem: ScoreValue
}

/** Điểm trực tiếp của một CLO trong một đợt đánh giá. */
export interface StudentCLOScore {
  cloId: string
  diem: ScoreValue
}

/** Ký hiệu điểm danh tại một buổi. */
export interface StudentAttendanceMark {
  buoiDiemDanhId: string
  kyHieu: string
}

/** Điểm nhập theo từng câu hỏi của một đợt đánh giá. */
export interface StudentQuestionAssessmentEntry {
  cachNhapDiem: Extract<AssessmentInputMode, 'QUESTION_SCORE'>
  dotDanhGiaId: string
  deId: string
  diemTheoCau: StudentQuestionScore[]
}

/** Điểm nhập trực tiếp theo CLO của một đợt đánh giá. */
export interface StudentDirectCLOAssessmentEntry {
  cachNhapDiem: Extract<AssessmentInputMode, 'DIRECT_CLO_SCORE'>
  dotDanhGiaId: string
  diemTheoClo: StudentCLOScore[]
}

/** Điểm danh theo từng buổi của một đợt chuyên cần. */
export interface StudentAttendanceAssessmentEntry {
  cachNhapDiem: Extract<AssessmentInputMode, 'ATTENDANCE'>
  dotDanhGiaId: string
  diemDanh: StudentAttendanceMark[]
}

/** Một loại dữ liệu điểm của sinh viên trong một đợt đánh giá. */
export type StudentAssessmentEntry =
  | StudentQuestionAssessmentEntry
  | StudentDirectCLOAssessmentEntry
  | StudentAttendanceAssessmentEntry

/** Toàn bộ dữ liệu điểm của một sinh viên trong một học phần. */
export interface StudentCourseScoreRecord {
  id: string
  sinhVienId: Student['id']
  hocPhanId: string
  diemTheoDotDanhGia: StudentAssessmentEntry[]
  ghiChu?: string
}
