/**
 * Suy ra cấu hình học phần theo từng giai đoạn nhập điểm.
 *
 * Config gốc luôn là nguồn duy nhất (tổng trọng số 100%, đủ CLO/PLO). Khi đọc và
 * kiểm tra một file điểm của riêng giai đoạn, ta lọc kế hoạch đánh giá + câu hỏi
 * theo nhóm: quá trình = CC/GK, cuối kỳ = CK. Nhờ vậy parser/validator/calculator
 * dùng lại được nguyên vẹn mà không đòi cột của giai đoạn còn lại.
 *
 * Lưu ý: KHÔNG chạy validator kế hoạch (tổng trọng số = 100%) trên config đã lọc.
 */

import type { CourseConfig, QuestionColumn } from '../types'
import type { GradePhase } from '../types/phase'

/** Lọc kế hoạch đánh giá và câu hỏi theo giai đoạn, giữ nguyên phần còn lại. */
export function phaseConfig(config: CourseConfig, phase: GradePhase): CourseConfig {
  const keHoachDanhGia = config.keHoachDanhGia.filter((item) =>
    phase === 'final' ? item.nhom === 'CK' : item.nhom !== 'CK'
  )

  const cellKeys = new Set(keHoachDanhGia.map((item) => cellKeyOf(item.maDauDiem, item.clo)))
  const cauHoi: QuestionColumn[] = config.cauHoi.filter((question) =>
    cellKeys.has(cellKeyOf(question.maDauDiem, question.clo))
  )

  return { ...config, keHoachDanhGia, cauHoi }
}

/** Cấu hình chỉ còn các đầu điểm quá trình (CC/GK). */
export function processConfig(config: CourseConfig): CourseConfig {
  return phaseConfig(config, 'process')
}

/** Cấu hình chỉ còn các đầu điểm cuối kỳ (CK). */
export function finalConfig(config: CourseConfig): CourseConfig {
  return phaseConfig(config, 'final')
}

/**
 * Danh sách mã đề CK khai báo tường minh trong câu hỏi.
 *
 * `ALL` không phải một đề riêng nên bị loại. Trường hợp CK nhập bằng cột điểm
 * trực tiếp (không có câu hỏi) thì không thể biểu diễn nhiều đề nên danh sách rỗng.
 */
export function finalExamVariants(config: CourseConfig): string[] {
  const ckCodes = new Set(
    config.keHoachDanhGia
      .filter((item) => item.nhom === 'CK')
      .map((item) => item.maDauDiem.trim())
  )
  const variants = new Set<string>()
  for (const question of config.cauHoi) {
    if (!ckCodes.has(question.maDauDiem.trim())) continue
    const maDe = question.maDe?.trim()
    if (maDe && maDe.toUpperCase() !== 'ALL') variants.add(maDe)
  }
  return Array.from(variants)
}

/** Cuối kỳ có nhiều hơn một mã đề cần phân biệt không. */
export function hasMultipleFinalExamVariants(config: CourseConfig): boolean {
  return finalExamVariants(config).length > 1
}

function cellKeyOf(maDauDiem: string, clo: string): string {
  return `${maDauDiem.trim()}|${clo.trim()}`
}
