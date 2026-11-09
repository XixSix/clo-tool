/**
 * Data Models: KIỂM TRA HỢP LỆ (VALIDATION)
 * Quy chuẩn: Đại học Thành Đông (QĐ 450/QĐ-ĐHTĐ ngày 07/8/2024)
 */

/** Mức độ của một phát hiện khi kiểm tra dữ liệu */
export type IssueLevel = 'error' | 'warning'

/** Khối nghiệp vụ phát sinh vấn đề khi kiểm tra dữ liệu. */
export type IssueScope =
  | 'course_info'
  | 'clo'
  | 'assessment'
  | 'exam'
  | 'plo'
  | 'integrity'
  | 'student'
  | 'raw_grades'

/**
 * Một lỗi / cảnh báo dữ liệu.
 * - `scope` cho biết vấn đề thuộc khối nào của model.
 * - `targetId` chỉ rõ đối tượng (mã CLO, đợt đánh giá, câu hỏi, PI...).
 * - `row` / `column` chỉ dùng khi vấn đề gắn với một ô bảng tính (điểm thô).
 */
export interface ValidationIssue {
  level: IssueLevel
  scope: IssueScope
  targetId?: string
  row?: number
  column?: string
  message: string
  suggestion?: string // Gợi ý sửa
}
