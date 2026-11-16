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

import type { Course } from '../types'
import type { GradePhase } from '../types/phase'

/** Lọc kế hoạch đánh giá và câu hỏi theo giai đoạn, giữ nguyên phần còn lại. */
export function phaseConfig(course: Course, phase: GradePhase): Course {
  const dotDanhGia = course.dotDanhGia.filter((dot) =>
    phase === 'final' ? dot.nhom === 'CK' : dot.nhom !== 'CK'
  )

  return { ...course, dotDanhGia }
}

/** Cấu hình chỉ còn các đợt đánh giá quá trình (CC/GK). */
export function processConfig(course: Course): Course {
  return phaseConfig(course, 'process')
}

/** Cấu hình chỉ còn các đợt đánh giá cuối kỳ (CK). */
export function finalConfig(course: Course): Course {
  return phaseConfig(course, 'final')
}

/**
 * Danh sách mã đề CK khai báo tường minh trong câu hỏi.
 *
 * `ALL` không phải một đề riêng nên bị loại. Trường hợp CK nhập bằng cột điểm
 * trực tiếp (không có câu hỏi) thì không thể biểu diễn nhiều đề nên danh sách rỗng.
 */
export function finalExamVariants(course: Course): string[] {
  const ckCodes = new Set(
    course.dotDanhGia.filter((dot) => dot.nhom === 'CK').map((dot) => dot.id)
  )
  const variants = new Set<string>()
  for (const dot of course.dotDanhGia) {
    if (!ckCodes.has(dot.id)) continue
    for (const variant of dot.maDeList) {
      const maDe = variant.maDe?.trim()
      if (maDe && maDe.toUpperCase() !== 'ALL') variants.add(maDe)
    }
  }
  return Array.from(variants)
}

/** Cuối kỳ có nhiều hơn một mã đề cần phân biệt không. */
export function hasMultipleFinalExamVariants(course: Course): boolean {
  return finalExamVariants(course).length > 1
}