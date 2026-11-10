/**
 * Suy ra danh sách cột điểm của file điểm thô từ Config.
 *
 * Ngoài các cột câu hỏi khai trong `CAU_HOI`, app còn hỗ trợ **cột điểm trực tiếp**:
 * đầu điểm không có câu hỏi con (ví dụ GK1, GK2) được nhập thẳng một điểm thang 10.
 * Cột đó mang đúng mã `Ma_Dau_Diem` và được dùng chung cho mọi CLO mà đầu điểm đo,
 * nhờ vậy không cần tách câu/ý theo từng CLO.
 */

import type { CourseConfig } from '../types'

/** Điểm tối đa mặc định của một cột điểm trực tiếp (thang 10) */
export const DIRECT_SCORE_COLUMN_MAX = 10

/** Các đầu điểm không khai báo câu hỏi cho ít nhất một CLO trong CAU_HOI */
export function directScoreColumns(config: CourseConfig): string[] {
  const result = new Set<string>()
  for (const p of config.keHoachDanhGia) {
    const maDauDiem = p.maDauDiem.trim()
    if (!maDauDiem) continue
    const hasQuestion = config.cauHoi.some(
      (q) => q.maDauDiem.trim() === maDauDiem && q.clo.trim() === p.clo.trim()
    )
    if (!hasQuestion) result.add(maDauDiem)
  }
  return Array.from(result)
}

/** Danh sách cột điểm cần có: cột câu hỏi trong CAU_HOI + cột điểm trực tiếp */
export function scoreColumnsFromConfig(config: CourseConfig): string[] {
  return Array.from(
    new Set([...config.cauHoi.map((q) => q.maCotDiem), ...directScoreColumns(config)])
  )
}

/** Điểm tối đa của một cột: lấy từ CAU_HOI, cột trực tiếp mặc định thang 10 */
export function maxScoreOfColumn(config: CourseConfig, maCotDiem: string): number {
  const question = config.cauHoi.find((q) => q.maCotDiem === maCotDiem)
  return question ? question.diemToiDa : DIRECT_SCORE_COLUMN_MAX
}
