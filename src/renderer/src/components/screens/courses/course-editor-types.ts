/**
 * Kiểu dữ liệu & hằng số dùng chung cho editor cấu hình học phần và wizard nhập theo đợt.
 * Mỗi dòng có _id ổn định để React không remount khi sửa nội dung;
 * _id bị loại bỏ khi lưu (serialize) — không lọt vào CourseConfig.
 */
import type {
  AttendanceRule,
  BusinessRules
} from '@core/types/rule'
import type {
  CLODefinition,
  CourseInfo,
  EvaluationPlanItem,
  PLOMapping,
  QuestionColumn
} from '@core/types/course'

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
