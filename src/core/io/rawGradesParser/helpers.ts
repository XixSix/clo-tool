/**
 * Hằng số và tiện ích dùng chung cho parser điểm thô.
 */

import type ExcelJS from 'exceljs'
import type { RawGradesMeta } from '../../types'
import { cellText, normalizeHeader } from '../../utils/excel'

/**
 * Cột cố định bắt buộc của file điểm thô.
 *
 * Dùng cùng quy tắc với Config: header một hàng, thiếu cột nào là dừng ngay.
 * `Ma_De` để tùy chọn vì file một đề không cần cột này.
 */
export const RAW_GRADES_COLUMNS = ['TT', 'Ma_SV', 'Ho', 'Ten', 'Ngay_Sinh', 'Ghi_Chu']

export const META_LABELS: { key: keyof RawGradesMeta; patterns: string[] }[] = [
  { key: 'tenHocPhan', patterns: ['hocphan', 'tenhocphan'] },
  { key: 'maHp', patterns: ['mahocphan', 'mahp'] },
  { key: 'lop', patterns: ['lop'] },
  { key: 'giangVien', patterns: ['giangvien', 'gv'] },
  { key: 'hocKy', patterns: ['hocky', 'ky', 'hocki'] },
  { key: 'namHoc', patterns: ['namhoc'] }
]

/** Danh sách cột điểm cần có, giữ thứ tự xuất hiện trong Config */
export {
  DIRECT_SCORE_COLUMN_MAX,
  directScoreColumns,
  maxScoreOfColumn,
  scoreColumnsFromConfig
} from '../../utils/scoreColumns'

/**
 * 3 format cột điểm danh hợp lệ:
 * 1. "Buổi 1", "Buổi 2"...
 * 2. "Buổi 1 (28/10)"...
 * 3. "28/10"...
 */
export const VALID_ATTENDANCE_HEADER = /^(buổi\s+\d+(\s*\(\d{1,2}\/\d{1,2}\))?|buoi\s+\d+(\s*\(\d{1,2}\/\d{1,2}\))?|\d{1,2}\/\d{1,2})$/i

export function isAttendanceHeader(header: string): boolean {
  return VALID_ATTENDANCE_HEADER.test(header.trim())
}

/** Phát hiện cột điểm danh sai quy cách để ném lỗi rõ ràng */
export function isInvalidAttendanceHeader(header: string): boolean {
  const trimmed = header.trim()
  if (isAttendanceHeader(trimmed)) return false
  const norm = normalizeHeader(trimmed)
  if (/^(tiet|session|tuan)\d+/i.test(norm)) return true
  if (/^buoi\d+/i.test(norm)) return true
  if (/^\d{1,2}[-.]\d{1,2}/.test(norm)) return true
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(norm)) return true
  return false
}

/** Đọc ô theo tên cột đã map; trả undefined nếu cột không có trong file */
export function columnCell(
  row: ExcelJS.Row,
  mapping: Record<string, number>,
  column: string
): ExcelJS.Cell | undefined {
  const index = mapping[column]
  return index === undefined ? undefined : row.getCell(index + 1)
}

/** Mã SV thay thế cho dòng thiếu mã, giữ đúng quy ước cũ */
export function missingMaSv(row: number): string {
  return `__MISSING_${row}`
}

/** Đọc Họ + Tên từ một dòng và ghép họ tên đầy đủ để hiển thị */
export function parseStudentName(
  row: ExcelJS.Row,
  mapping: Record<string, number>
): { ho: string; ten: string; hoTen: string } {
  const ho = cellText(columnCell(row, mapping, 'Ho')).trim()
  const ten = cellText(columnCell(row, mapping, 'Ten')).trim()
  return { ho, ten, hoTen: [ho, ten].filter(Boolean).join(' ') }
}
