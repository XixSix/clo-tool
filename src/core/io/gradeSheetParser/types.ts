/**
 * Kiểu dữ liệu nội bộ của bộ parser bảng điểm.
 */

import type { SheetStudentRow } from '../../types'

/** Header của bảng điểm sau khi dò theo tên cột. */
export interface GradeSheetHeaderInfo {
  rowNumber: number
  headers: string[]
  mapping: Record<string, number>
  suggestions: Record<string, string>
}

/** Cột điểm danh đã phát hiện trong header. */
export interface AttendanceColumn {
  index: number
  tenBuoi: string
}

/** Kết quả đọc phần dữ liệu sinh viên. */
export interface ParsedStudentRows {
  sinhVien: SheetStudentRow[]
  dongExcelSinhVien: number[]
}

/** Kết quả đọc hàng "Điểm tối đa". */
export interface DeclaredMaxScoreResult {
  diemToiDa: Record<string, number>
  dongSinhVienDau: number
}
