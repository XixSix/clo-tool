/**
 * Validate sheet KE_HOACH_DANH_GIA — kế hoạch đánh giá từng CLO.
 */

import type { CourseConfig, ValidationIssue } from '../types'
import { roundHalfUp } from '../rules'

const VALID_GROUPS = new Set(['CC', 'GK', 'CK'])

export function validateKeHoach(config: CourseConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const totalWeight = config.keHoachDanhGia.reduce((sum, p) => sum + p.trongSoPhanTram, 0)
  // Cờ: có trọng số không nguyên → lỗi "tổng ≠ 100%" trở thành nhiễu
  // (lỗi gốc đã nằm ở từng dòng), nên chỉ so tổng khi mọi trọng số đều nguyên
  let hasIntegerViolation = false

  const seenPairs = new Set<string>()
  for (const p of config.keHoachDanhGia) {
    // Validate nhóm
    if (!VALID_GROUPS.has(p.nhom)) {
      issues.push({
        level: 'error',
        sheet: 'KE_HOACH_DANH_GIA',
        column: 'Nhom',
        message: `Nhóm "${p.nhom}" không hợp lệ (chỉ nhận CC, GK, CK).`
      })
    }

    // Validate mã đầu điểm
    if (!p.maDauDiem || p.maDauDiem.trim() === '') {
      issues.push({
        level: 'error',
        sheet: 'KE_HOACH_DANH_GIA',
        column: 'Ma_Dau_Diem',
        message: 'Thiếu Mã đầu điểm.'
      })
    }

    // Validate trọng số
    if (!Number.isInteger(p.trongSoPhanTram)) {
      issues.push({
        level: 'error',
        sheet: 'KE_HOACH_DANH_GIA',
        column: 'Trong_So_Phan_Tram',
        message: `Trọng số của đầu điểm "${p.maDauDiem}" (CLO "${p.clo}") phải là số nguyên % (nhận ${p.trongSoPhanTram}).`
      })
      hasIntegerViolation = true
    } else if (p.trongSoPhanTram <= 0) {
      issues.push({
        level: 'error',
        sheet: 'KE_HOACH_DANH_GIA',
        column: 'Trong_So_Phan_Tram',
        message: `Trọng số của đầu điểm "${p.maDauDiem}" phải lớn hơn 0.`
      })
    }

    // Cùng một đầu điểm xuất hiện ở cả nhóm GK và CK -> dữ liệu nhập nhầm
    for (const other of config.keHoachDanhGia) {
      if (other === p) continue
      if (
        other.maDauDiem === p.maDauDiem &&
        other.nhom !== p.nhom &&
        p.nhom !== 'CC' &&
        other.nhom !== 'CC'
      ) {
        issues.push({
          level: 'error',
          sheet: 'KE_HOACH_DANH_GIA',
          column: 'Ma_Dau_Diem',
          message: `Mã đầu điểm "${p.maDauDiem}" bị dùng ở cả nhóm ${p.nhom} và ${other.nhom}.`
        })
        break
      }
    }

    // Cặp (đầu điểm, CLO) bị lặp -> trọng số cộng đôi
    const pairKey = `${p.maDauDiem}|${p.clo}`
    if (seenPairs.has(pairKey)) {
      issues.push({
        level: 'error',
        sheet: 'KE_HOACH_DANH_GIA',
        message: `Cặp đầu điểm "${p.maDauDiem}" – CLO "${p.clo}" bị lặp trong kế hoạch.`
      })
    }
    seenPairs.add(pairKey)
  }

  // Validate tổng trọng số — SAU vòng for: số nguyên đã được kiểm tra ở từng dòng,
  // nếu có lỗi gốc thì báo tổng chỉ gây nhiễu. Trọng số nguyên + số nguyên trong
  // float cộng chính xác tuyệt đối → so sánh bằng trực tiếp, không cần biên độ EPSILON
  // (khác với tổng đề 10 ở crossSheet: điểm tối đa câu cho phép thập phân
  // không bội 0,25 nên tổng float cần biên độ).
  if (!hasIntegerViolation && totalWeight !== 100) {
    issues.push({
      level: 'error',
      sheet: 'KE_HOACH_DANH_GIA',
      column: 'Trong_So_Phan_Tram',
      message: `Tổng trọng số kế hoạch đánh giá = ${roundHalfUp(totalWeight, 2)}%, phải bằng 100%.`
    })
  }

  // CLO chỉ đo bằng chuyên cần/thái độ (Quyết định #7: không chặn)
  if (config.quyTac.canh_bao_cc_don_le) {
    for (const clo of config.cloList) {
      const items = config.keHoachDanhGia.filter((p) => p.clo === clo.maClo)
      if (items.length > 0 && items.every((p) => p.nhom === 'CC')) {
        issues.push({
          level: 'warning',
          sheet: 'KE_HOACH_DANH_GIA',
          message: `CLO "${clo.maClo}" chỉ được đo bằng chuyên cần/thái độ (nhóm CC).`,
          suggestion: 'Nên bổ sung đầu điểm khác nếu CLO này cần đánh giá năng lực tự chủ.'
        })
      }
    }
  }

  return issues
}
