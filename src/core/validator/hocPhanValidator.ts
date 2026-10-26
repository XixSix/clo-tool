/**
 * Validate sheet HOC_PHAN — thông tin chung của học phần.
 */

import type { CourseConfig, ValidationIssue } from '../types'

const VALID_LOAI_HP = new Set(['thuong', 'thuc_hanh'])

export function validateHocPhan(config: CourseConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const info = config.courseInfo

  // Validate Ma_HP
  if (!info.maHp || info.maHp.trim() === '') {
    issues.push({
      level: 'error',
      sheet: 'HOC_PHAN',
      column: 'Ma_HP',
      message: 'Thiếu Mã học phần (Ma_HP).'
    })
  }

  // Validate Ten_HP
  if (!info.tenHp || info.tenHp.trim() === '') {
    issues.push({
      level: 'error',
      sheet: 'HOC_PHAN',
      column: 'Ten_HP',
      message: 'Thiếu Tên học phần (Ten_HP).'
    })
  }

  if (!Number.isInteger(info.soTinChi) || info.soTinChi <= 0) {
    issues.push({
      level: 'error',
      sheet: 'HOC_PHAN',
      column: 'So_Tin_Chi',
      message: `Số tín chỉ phải là số nguyên lớn hơn 0 (hiện tại: ${info.soTinChi}).`
    })
  }

  // Hình thức thi chỉ dùng cho xuất Phụ lục 3 và UI -> thiếu chỉ cảnh báo
  if (!info.hinhThucThi || info.hinhThucThi.trim() === '') {
    issues.push({
      level: 'warning',
      sheet: 'HOC_PHAN',
      column: 'Hinh_Thuc_Thi',
      message: 'Hình thức thi chưa điền — Phụ lục 3 sẽ thiếu mục "Hình thức thi".'
    })
  }

  // Validate Loai_HP
  if (!VALID_LOAI_HP.has(info.loaiHp)) {
    issues.push({
      level: 'error',
      sheet: 'HOC_PHAN',
      column: 'Loai_HP',
      message: `Loại học phần "${info.loaiHp}" không hợp lệ (chỉ nhận "thuong" hoặc "thuc_hanh").`
    })
  }

  return issues
}
