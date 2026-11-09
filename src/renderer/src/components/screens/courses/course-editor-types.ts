/**
 * Kiểu dữ liệu & hằng số dùng chung cho editor cấu hình học phần và wizard nhập theo đợt.
 * Mỗi dòng có _id ổn định để React không remount khi sửa nội dung;
 * _id bị loại bỏ khi lưu (serialize).
 *
 * Đây là dạng phẳng chỉ tồn tại trong renderer: khi lưu, dữ liệu được chuyển
 * sang model phân cấp `Course` của core (xem `course-adapter.ts`).
 */
import type { AttendanceRule, BusinessRules } from '@core/types/rule'
import type { AssessmentGroup, AssessmentInputMode } from '@core/types/course'

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
  bacNangLuc: string
  /** Chỉ dùng cho học phần thực hành; tổng trọng số phải bằng 100%. */
  trongSoClo?: number
}

export interface EvaluationPlanItem {
  nhom: AssessmentGroup
  thanhPhan: string
  maDauDiem: string
  clo: string
  /** Trọng số của ô (đầu điểm, CLO) trong toàn kế hoạch; tổng = 100%. */
  trongSoPhanTram: number
  hinhThuc?: string
  cachNhapDiem?: AssessmentInputMode
}

export interface QuestionColumn {
  maCotDiem: string
  maDauDiem: string
  cau: string
  clo: string
  diemToiDa: number
  maDe?: string
  loai?: 'TL' | 'TN'
}

export interface PLOMapping {
  plo: string
  pi: string
  clo: string
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

export interface EditorClo extends CLODefinition {
  _id: string
}
export interface EditorPlan extends EvaluationPlanItem {
  _id: string
}
export interface EditorQuestion extends QuestionColumn {
  _id: string
}
export interface EditorPlo extends PLOMapping {
  _id: string
}

export interface EditorConfig {
  courseInfo: CourseInfo
  cloList: EditorClo[]
  keHoachDanhGia: EditorPlan[]
  cauHoi: EditorQuestion[]
  maTranPlo: EditorPlo[]
  diemDanh?: AttendanceRule[]
  quyTac: BusinessRules
}

export const ASSESSMENT_GROUPS: { value: 'CC' | 'GK' | 'CK'; label: string }[] = [
  { value: 'CC', label: 'Chuyên cần (CC)' },
  { value: 'GK', label: 'Giữa kỳ (GK)' },
  { value: 'CK', label: 'Cuối kỳ (CK)' }
]

export const QUESTION_TYPES: { value: 'TL' | 'TN'; label: string }[] = [
  { value: 'TL', label: 'Tự luận (TL)' },
  { value: 'TN', label: 'Trắc nghiệm (TN)' }
]
