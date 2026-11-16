/**
 * Validate thông tin chung của học phần (khối `course_info`).
 */

import type { Course, ValidationIssue } from '../../types'

const VALID_LOAI_HP = new Set(['thuong', 'thuc_hanh'])

/** Kiểm tra mã, tên, số tín chỉ, loại học phần và hình thức thi. */
export function validateCourseInfo(course: Course): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  if (!course.maHp || course.maHp.trim() === '') {
    issues.push({
      level: 'error',
      scope: 'course_info',
      targetId: 'maHp',
      message: 'Thiếu Mã học phần (Ma_HP).'
    })
  }

  if (!course.tenHp || course.tenHp.trim() === '') {
    issues.push({
      level: 'error',
      scope: 'course_info',
      targetId: 'tenHp',
      message: 'Thiếu Tên học phần (Ten_HP).'
    })
  }

  if (!Number.isInteger(course.soTinChi) || course.soTinChi <= 0) {
    issues.push({
      level: 'error',
      scope: 'course_info',
      targetId: 'soTinChi',
      message: `Số tín chỉ phải là số nguyên lớn hơn 0 (hiện tại: ${course.soTinChi}).`
    })
  }

  if (!course.hinhThucThi || course.hinhThucThi.trim() === '') {
    issues.push({
      level: 'warning',
      scope: 'course_info',
      targetId: 'hinhThucThi',
      message: 'Hình thức thi chưa điền — Phụ lục 3 sẽ thiếu mục "Hình thức thi".'
    })
  }

  if (!VALID_LOAI_HP.has(course.loaiHp)) {
    issues.push({
      level: 'error',
      scope: 'course_info',
      targetId: 'loaiHp',
      message: `Loại học phần "${course.loaiHp}" không hợp lệ (chỉ nhận "thuong" hoặc "thuc_hanh").`
    })
  }

  return issues
}
