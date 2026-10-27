/**
 * Kiểu dữ liệu nội bộ của bộ parser điểm thô.
 */

import type { AttendanceRecord, RawStudentRow } from '../../types'

/** Header của bảng điểm thô sau khi dò theo tên cột */
export interface RawHeaderInfo {
  rowNumber: number
  headers: string[]
  mapping: Record<string, number>
  suggestions: Record<string, string>
}

/** Cột điểm danh đã phát hiện trong header */
export interface AttendanceColumn {
  index: number
  label: string
}

/** Kết quả đọc phần dữ liệu sinh viên */
export interface ParsedStudentRows {
  students: RawStudentRow[]
  attendance: AttendanceRecord[]
}

/** Kết quả đọc hàng "Điểm tối đa" */
export interface DeclaredMaxScoreResult {
  scores: Record<string, number>
  firstStudentRow: number
}
