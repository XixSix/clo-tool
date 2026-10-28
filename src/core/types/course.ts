/**
 * Data Models: CẤU HÌNH HỌC PHẦN (COURSE CONFIG INPUT)
 * Quy chuẩn: Đại học Thành Đông (QĐ 450/QĐ-ĐHTĐ ngày 07/8/2024)
 */

import type { AttendanceRule, BusinessRules } from './rule'

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

export interface CourseConfig {
  courseInfo: CourseInfo
  cloList: CLODefinition[]
  keHoachDanhGia: EvaluationPlanItem[]
  cauHoi: QuestionColumn[]
  maTranPlo: PLOMapping[]
  diemDanh?: AttendanceRule[]
  quyTac: BusinessRules
}
