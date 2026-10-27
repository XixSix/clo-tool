/**
 * Validate sheet KE_HOACH_DANH_GIA — kế hoạch đánh giá từng CLO.
 */

import type { CourseConfig, ValidationIssue } from '../../types'
import { roundHalfUp } from '../../rules'

const VALID_GROUPS = new Set(['CC', 'GK', 'CK'])

export const validateKeHoach = (config: CourseConfig): ValidationIssue[] => {
  const issues: ValidationIssue[] = []
  const plan = config.keHoachDanhGia

  // Validate all sheet
  if (plan.length === 0) {
    issues.push({
      level: 'error',
      sheet: 'KE_HOACH_DANH_GIA',
      message: 'Chưa khai báo kế hoạch đánh giá nào.'
    })
  }

  // Gom nhóm theo đầu điểm / CLO trong một lượt duyệt, thay cho các vòng lặp lồng nhau
  const groupsByDauDiem = new Map<string, Set<string>>()
  const groupsByClo = new Map<string, Set<string>>()
  const seenPairs = new Set<string>()

  for (const p of plan) {
    // Validate Nhom
    if (!VALID_GROUPS.has(p.nhom)) {
      issues.push({
        level: 'error',
        sheet: 'KE_HOACH_DANH_GIA',
        column: 'Nhom',
        message: `Nhóm "${p.nhom}" không hợp lệ (chỉ nhận CC, GK, CK).`
      })
    }

    // Validate Thanh_Phan
    if (!p.thanhPhan || p.thanhPhan.trim() === '') {
      issues.push({
        level: 'warning',
        sheet: 'KE_HOACH_DANH_GIA',
        column: 'Thanh_Phan',
        message: 'Thiếu Thành phần.'
      })
    }

    // Validate Ma_Dau_Diem
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
    } else if (p.trongSoPhanTram <= 0) {
      issues.push({
        level: 'error',
        sheet: 'KE_HOACH_DANH_GIA',
        column: 'Trong_So_Phan_Tram',
        message: `Trọng số của đầu điểm "${p.maDauDiem}" phải lớn hơn 0.`
      })
    }

    // Validate Hinh_Thiuc
    if (!p.hinhThuc || p.hinhThuc.trim() === '') {
      issues.push({
        level: 'warning',
        sheet: 'KE_HOACH_DANH_GIA',
        column: 'Hinh_Thuc',
        message: 'Thiếu Hình thức.'
      })
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

    addToGroup(groupsByDauDiem, p.maDauDiem, p.nhom)
    addToGroup(groupsByClo, p.clo, p.nhom)
  }

  // Cùng một đầu điểm xuất hiện ở 2 nhóm khác CC (GK/CK) -> dữ liệu nhập nhầm
  for (const [maDauDiem, groups] of groupsByDauDiem) {
    const nonCc = [...groups].filter((g) => g !== 'CC')
    if (nonCc.length > 1) {
      issues.push({
        level: 'error',
        sheet: 'KE_HOACH_DANH_GIA',
        column: 'Ma_Dau_Diem',
        message: `Mã đầu điểm "${maDauDiem}" bị dùng ở cả nhóm ${nonCc.join(' và ')}.`
      })
    }
  }

  // Chỉ so tổng khi mọi trọng số đều nguyên: trọng số thập phân đã báo lỗi ở
  // từng dòng nên "tổng ≠ 100%" chỉ gây nhiễu. Trọng số nguyên cộng chính xác
  // tuyệt đối trong float -> so sánh trực tiếp, không cần EPSILON.
  const totalWeight = plan.reduce((sum, p) => sum + p.trongSoPhanTram, 0)
  if (plan.every((p) => Number.isInteger(p.trongSoPhanTram)) && totalWeight !== 100) {
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
      const groups = groupsByClo.get(clo.maClo)
      if (groups && [...groups].every((g) => g === 'CC')) {
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

function addToGroup(map: Map<string, Set<string>>, key: string, value: string): void {
  const set = map.get(key) ?? new Set<string>()
  set.add(value)
  map.set(key, set)
}
