/**
 * Validate danh mục chuẩn đầu ra học phần — CLO (khối `clo`).
 */

import { roundHalfUp } from '../../rules'
import type { Course, ValidationIssue } from '../../types'

// Chấp nhận cả dạng phân cấp CLOx.y (ví dụ CLO1.1) theo QĐ450
const CLO_CODE_PATTERN = /^CLO\d+(\.\d+)?$/

export function validateCloList(course: Course): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const cloList = course.cloList

  if (cloList.length === 0) {
    issues.push({
      level: 'error',
      scope: 'clo',
      message: 'Chưa khai báo CLO nào.'
    })
  }

  const seen = new Set<string>()
  for (const clo of cloList) {
    if (!clo.maClo || clo.maClo.trim() === '') {
      issues.push({
        level: 'error',
        scope: 'clo',
        targetId: 'maClo',
        message: 'Thiếu Mã CLO.'
      })
      continue
    }

    if (!CLO_CODE_PATTERN.test(clo.maClo)) {
      issues.push({
        level: 'error',
        scope: 'clo',
        targetId: clo.maClo,
        message: `Mã CLO "${clo.maClo}" phải theo dạng CLOx hoặc CLOx.y (ví dụ CLO1, CLO2, CLO1.1).`
      })
    }

    if (seen.has(clo.maClo)) {
      issues.push({
        level: 'error',
        scope: 'clo',
        targetId: clo.maClo,
        message: `Mã CLO "${clo.maClo}" bị lặp.`
      })
    }
    seen.add(clo.maClo)

    if (!clo.noiDung || clo.noiDung.trim() === '') {
      issues.push({
        level: 'warning',
        scope: 'clo',
        targetId: clo.maClo,
        message: `CLO "${clo.maClo}" thiếu nội dung (Noi_Dung).`
      })
    }

    if (!clo.bacNangLuc || clo.bacNangLuc.trim() === '') {
      issues.push({
        level: 'warning',
        scope: 'clo',
        targetId: clo.maClo,
        message: `CLO "${clo.maClo}" thiếu bậc năng lực (Bac_Nang_Luc).`
      })
    } else {
      const m = /^(\d+)\/(\d+)$/.exec(clo.bacNangLuc.trim())
      if (!m) {
        issues.push({
          level: 'warning',
          scope: 'clo',
          targetId: clo.maClo,
          message: `Bậc năng lực "${clo.bacNangLuc}" của CLO "${clo.maClo}" sai định dạng — phải dạng bậc/thang (ví dụ 3/6).`
        })
      } else {
        const bac = Number(m[1])
        const thang = Number(m[2])
        if (bac < 1 || thang < 1 || bac > thang) {
          issues.push({
            level: 'warning',
            scope: 'clo',
            targetId: clo.maClo,
            message: `Bậc năng lực "${clo.bacNangLuc}" của CLO "${clo.maClo}" không hợp lệ — bậc phải là số nguyên từ 1 đến thang (${thang}).`
          })
        }
      }
    }

    if (
      clo.trongSoClo !== undefined &&
      (!Number.isFinite(clo.trongSoClo) || clo.trongSoClo <= 0 || clo.trongSoClo > 100)
    ) {
      issues.push({
        level: 'error',
        scope: 'clo',
        targetId: clo.maClo,
        message: `Trọng số CLO của "${clo.maClo}" phải thuộc (0..100].`
      })
    }
  }

  // Học phần thực hành (QĐ450 Điều 9.3): C_hp = Σ CLO_k × trọng số CLO_k.
  if (course.loaiHp === 'thuc_hanh' && cloList.length > 0) {
    const missing = cloList.filter((c) => c.trongSoClo === undefined)
    if (missing.length > 0) {
      issues.push({
        level: 'error',
        scope: 'clo',
        message: `Học phần thực hành yêu cầu khai báo Trọng số CLO cho mọi CLO (thiếu: ${missing
          .map((c) => c.maClo)
          .join(', ')}).`
      })
    } else {
      const total = cloList.reduce((sum, c) => sum + (c.trongSoClo ?? 0), 0)
      if (roundHalfUp(total, 2) !== 100) {
        issues.push({
          level: 'error',
          scope: 'clo',
          message: `Học phần thực hành yêu cầu tổng Trọng số CLO = 100% (hiện ${roundHalfUp(total, 2)}%).`
        })
      }
    }
  }

  return issues
}
