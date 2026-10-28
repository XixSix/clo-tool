/**
 * Data Models: KIỂM TRA HỢP LỆ (VALIDATION)
 * Quy chuẩn: Đại học Thành Đông (QĐ 450/QĐ-ĐHTĐ ngày 07/8/2024)
 */

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
