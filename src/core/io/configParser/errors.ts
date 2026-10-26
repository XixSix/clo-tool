/** Lỗi cấu trúc khiến Config không thể parse thành CourseConfig hợp lệ. */
export class ConfigParseError extends Error {
  readonly code = 'CONFIG_PARSE_ERROR'

  constructor(message: string) {
    super(message)
    this.name = 'ConfigParseError'
  }
}
