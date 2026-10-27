/**
 * Hằng số và tiện ích dùng chung cho parser điểm thô.
 */

import type ExcelJS from 'exceljs'
import type { CourseConfig, RawGradesMeta } from '../../types'
import { normalizeHeader } from '../../utils/excel'

export const BASE_COLUMNS = ['TT', 'Ma_SV', 'Ho', 'Ten', 'Ho_Ten', 'Ngay_Sinh', 'Ma_De', 'Ghi_Chu']

export const META_LABELS: { key: keyof RawGradesMeta; patterns: string[] }[] = [
  { key: 'tenHocPhan', patterns: ['hocphan', 'tenhocphan'] },
  { key: 'lop', patterns: ['lop'] },
  { key: 'giangVien', patterns: ['giangvien', 'gv'] },
  { key: 'hocKy', patterns: ['hocky', 'ky'] },
  { key: 'namHoc', patterns: ['namhoc'] }
]

/** Danh sách cột điểm cần có, giữ thứ tự xuất hiện trong Config */
export function scoreColumnsFromConfig(config: CourseConfig): string[] {
  return Array.from(new Set(config.cauHoi.map((q) => q.maCotDiem)))
}

/** "Buổi 1", "Tiết 1", "Session 1", "Tuần 1"... */
export function isAttendanceHeader(header: string): boolean {
  return /^(buoi|tiet|session|tuan)\d+/.test(normalizeHeader(header))
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
