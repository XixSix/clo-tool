/**
 * Lỗi cấu trúc khi đọc file điểm thô.
 *
 * Parser chỉ ném lỗi khi không thể đọc dữ liệu; lỗi nghiệp vụ vẫn thuộc validator.
 */

export class RawGradesParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RawGradesParseError'
  }
}
