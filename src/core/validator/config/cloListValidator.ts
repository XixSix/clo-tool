/**
 * Validate sheet CLO_LIST — danh mục chuẩn đầu ra (CLO).
 */

import { roundHalfUp } from '../../rules'
import type { CourseConfig, ValidationIssue } from '../../types'

// Chấp nhận cả dạng phân cấp CLOx.y (ví dụ CLO1.1) theo QĐ450
const CLO_CODE_PATTERN = /^CLO\d+(\.\d+)?$/

export function validateCloList(config: CourseConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const cloList = config.cloList

  // Validate all sheet
  if (cloList.length === 0) {
    issues.push({
      level: 'error',
      sheet: 'CLO_LIST',
      message: 'Chưa khai báo CLO nào.'
    })
  }

  const seen = new Set<string>()
  for (const clo of cloList) {
    // Validate Ma_CLO
    if (!clo.maClo || clo.maClo.trim() === '') {
      issues.push({
        level: 'error',
        sheet: 'CLO_LIST',
        column: 'Ma_CLO',
        message: 'Thiếu Mã CLO.'
      })
      continue
    }

    if (!CLO_CODE_PATTERN.test(clo.maClo)) {
      issues.push({
        level: 'error',
        sheet: 'CLO_LIST',
        column: 'Ma_CLO',
        message: `Mã CLO "${clo.maClo}" phải theo dạng CLOx hoặc CLOx.y (ví dụ CLO1, CLO2, CLO1.1).`
      })
    }

    if (seen.has(clo.maClo)) {
      issues.push({
        level: 'error',
        sheet: 'CLO_LIST',
        column: 'Ma_CLO',
        message: `Mã CLO "${clo.maClo}" bị lặp.`
      })
    }
    seen.add(clo.maClo)

    // Validate Noi_Dung
    if (!clo.noiDung || clo.noiDung.trim() === '') {
      issues.push({
        level: 'warning',
        sheet: 'CLO_LIST',
        column: 'Noi_Dung',
        message: `CLO "${clo.maClo}" thiếu nội dung (Noi_Dung).`
      })
    }

    // Bậc năng lực dạng "bậc/thang" (QĐ450: 3/6, 3/5, 4/6) — chỉ dùng hiển thị
    // trong template/Phụ lục, không tham gia tính điểm nên mọi khuyết tật chỉ cảnh báo
    if (!clo.bacNangLuc || clo.bacNangLuc.trim() === '') {
      issues.push({
        level: 'warning',
        sheet: 'CLO_LIST',
        column: 'Bac_Nang_Luc',
        message: `CLO "${clo.maClo}" thiếu bậc năng lực (Bac_Nang_Luc).`
      })
    } else {
      const m = /^(\d+)\/(\d+)$/.exec(clo.bacNangLuc.trim())
      if (!m) {
        issues.push({
          level: 'warning',
          sheet: 'CLO_LIST',
          column: 'Bac_Nang_Luc',
          message: `Bậc năng lực "${clo.bacNangLuc}" của CLO "${clo.maClo}" sai định dạng — phải dạng bậc/thang (ví dụ 3/6).`
        })
      } else {
        const bac = Number(m[1])
        const thang = Number(m[2])
        if (bac < 1 || thang < 1 || bac > thang) {
          issues.push({
            level: 'warning',
            sheet: 'CLO_LIST',
            column: 'Bac_Nang_Luc',
            message: `Bậc năng lực "${clo.bacNangLuc}" của CLO "${clo.maClo}" không hợp lệ — bậc phải là số nguyên từ 1 đến thang (${thang}).`
          })
        }
      }
    }

    // Validate Trong_So_CLO — chỉ có nghĩa với học phần thực hành/đồ án/thực tập/
    // khóa luận. Nếu có khai báo thì luôn phải nằm trong (0..100].
    if (
      clo.trongSoClo !== undefined &&
      (!Number.isFinite(clo.trongSoClo) || clo.trongSoClo <= 0 || clo.trongSoClo > 100)
    ) {
      issues.push({
        level: 'error',
        sheet: 'CLO_LIST',
        column: 'Trong_So_CLO',
        message: `Trọng số CLO của "${clo.maClo}" phải thuộc (0..100].`
      })
    }
  }

  // Học phần thực hành (QĐ450 Điều 9.3): C_hp = Σ CLO_k × trọng số CLO_k,
  // bắt buộc mọi CLO có trọng số và tổng đúng 100% (không chuẩn hóa chia lại).
  if (config.courseInfo.loaiHp === 'thuc_hanh' && cloList.length > 0) {
    const missing = cloList.filter((c) => c.trongSoClo === undefined)
    if (missing.length > 0) {
      issues.push({
        level: 'error',
        sheet: 'CLO_LIST',
        column: 'Trong_So_CLO',
        message: `Học phần thực hành yêu cầu khai báo Trọng số CLO cho mọi CLO (thiếu: ${missing
          .map((c) => c.maClo)
          .join(', ')}).`
      })
    } else {
      const total = cloList.reduce((sum, c) => sum + (c.trongSoClo ?? 0), 0)
      if (roundHalfUp(total, 2) !== 100) {
        issues.push({
          level: 'error',
          sheet: 'CLO_LIST',
          column: 'Trong_So_CLO',
          message: `Học phần thực hành yêu cầu tổng Trọng số CLO = 100% (hiện ${roundHalfUp(total, 2)}%).`
        })
      }
    }
  }

  return issues
}
