/**
 * Data Models: KIỂM TRA HỢP LỆ & KẾT QUẢ ĐỌC FILE
 * Quy chuẩn: Đại học Thành Đông (QĐ 450/QĐ-ĐHTĐ ngày 07/8/2024)
 */

import type { RawStudentRow } from './student'
import type { CourseConfig } from './course'

/** Mức độ của một phát hiện khi kiểm tra dữ liệu */
export type IssueLevel = 'error' | 'warning'

/**
 * Một lỗi / cảnh báo dữ liệu.
 * Luôn cố gắng chỉ rõ vị trí: sheet + dòng + cột.
 */
export interface ValidationIssue {
  level: IssueLevel
  sheet?: string
  row?: number
  column?: string
  message: string
  suggestion?: string // Gợi ý sửa
}

/** Kết quả đọc một file Excel */
export interface ParseResult<T> {
  data?: T
  issues: ValidationIssue[]
  hasErrors: boolean
}

/** Kết quả đọc file Config học phần (CourseConfig) */
export interface ConfigParseResult {
  config?: CourseConfig
  issues: ValidationIssue[]
  hasErrors: boolean
}

/** Thông tin lớp đọc từ phần đầu sheet NHAP_LIEU */
export interface RawGradesMeta {
  lop?: string
  giangVien?: string
  hocKy?: string
  namHoc?: string
  tenHocPhan?: string
}

/** Điểm danh của một sinh viên theo từng buổi */
export interface AttendanceRecord {
  maSv: string
  /** key = tên cột buổi (ví dụ "Buổi 1") */
  symbols: Record<string, string>
}

/** Cột điểm danh phát hiện được trong file điểm thô */
export interface AttendanceSession {
  column: string
  label: string
}

/** Toàn bộ dữ liệu đọc được từ file điểm thô */
export interface RawGradesFile {
  meta: RawGradesMeta
  students: RawStudentRow[]
  attendance: AttendanceRecord[]
  attendanceSessions: AttendanceSession[]
  /** Điểm tối đa đọc từ hàng "Điểm tối đa" (nếu có) */
  declaredMaxScores: Record<string, number>
}

/** Kết quả tính điểm chuyên cần từ ký hiệu điểm danh */
export interface AttendanceScore {
  maSv: string
  /** Điểm chuyên cần thang 10 */
  score: number
  soBuoi: number
  soVangKhongPhep: number
  soVangCoPhep: number
  symbolsLa: string[]
}
