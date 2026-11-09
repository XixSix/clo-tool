/**
 * Validate các đợt đánh giá và tỷ lệ phân bổ CLO (khối `assessment`).
 */

import type { AssessmentGroup, Course, ValidationIssue } from '../../types'
import { roundHalfUp } from '../../rules'

const VALID_GROUPS: AssessmentGroup[] = ['CC', 'GK', 'CK']
const VALID_INPUT_MODES = new Set(['QUESTION_SCORE', 'DIRECT_CLO_SCORE', 'ATTENDANCE'])

export const validateAssessment = (course: Course): ValidationIssue[] => {
  const issues: ValidationIssue[] = []
  const dots = course.dotDanhGia

  if (dots.length === 0) {
    issues.push({
      level: 'error',
      scope: 'assessment',
      message: 'Chưa khai báo đợt đánh giá nào.'
    })
  }

  const seenDotIds = new Set<string>()
  const groupsByClo = new Map<string, Set<AssessmentGroup>>()

  for (const dot of dots) {
    if (!dot.id || dot.id.trim() === '') {
      issues.push({
        level: 'error',
        scope: 'assessment',
        targetId: 'id',
        message: 'Thiếu mã đợt đánh giá.'
      })
    } else if (seenDotIds.has(dot.id)) {
      issues.push({
        level: 'error',
        scope: 'assessment',
        targetId: dot.id,
        message: `Mã đợt đánh giá "${dot.id}" bị lặp.`
      })
    }
    seenDotIds.add(dot.id)

    if (!dot.tenDotDanhGia || dot.tenDotDanhGia.trim() === '') {
      issues.push({
        level: 'warning',
        scope: 'assessment',
        targetId: dot.id,
        message: `Đợt "${dot.id}" thiếu tên thành phần đánh giá.`
      })
    }

    if (!VALID_GROUPS.includes(dot.nhom)) {
      issues.push({
        level: 'error',
        scope: 'assessment',
        targetId: dot.id,
        message: `Nhóm "${dot.nhom}" không hợp lệ (chỉ nhận CC, GK, CK).`
      })
    }

    if (!VALID_INPUT_MODES.has(dot.cachNhapDiem)) {
      issues.push({
        level: 'error',
        scope: 'assessment',
        targetId: dot.id,
        message: `Cách nhập điểm "${dot.cachNhapDiem}" không hợp lệ.`
      })
    }

    if (!Number.isInteger(dot.trongSoPhanTram)) {
      issues.push({
        level: 'error',
        scope: 'assessment',
        targetId: dot.id,
        message: `Trọng số của đợt "${dot.id}" phải là số nguyên % (nhận ${dot.trongSoPhanTram}).`
      })
    } else if (dot.trongSoPhanTram <= 0) {
      issues.push({
        level: 'error',
        scope: 'assessment',
        targetId: dot.id,
        message: `Trọng số của đợt "${dot.id}" phải lớn hơn 0.`
      })
    }

    if (dot.cloList.length === 0) {
      issues.push({
        level: 'error',
        scope: 'assessment',
        targetId: dot.id,
        message: `Đợt "${dot.id}" chưa gán CLO nào.`
      })
    }

    const seenClo = new Set<string>()
    let tổngTyLe = 0
    for (const mapping of dot.cloList) {
      if (!mapping.cloId || mapping.cloId.trim() === '') {
        issues.push({
          level: 'error',
          scope: 'assessment',
          targetId: dot.id,
          message: `Đợt "${dot.id}" có ánh xạ CLO thiếu mã.`
        })
        continue
      }
      if (seenClo.has(mapping.cloId)) {
        issues.push({
          level: 'error',
          scope: 'assessment',
          targetId: dot.id,
          message: `CLO "${mapping.cloId}" bị lặp trong đợt "${dot.id}".`
        })
      }
      seenClo.add(mapping.cloId)

      if (!Number.isFinite(mapping.tyLePhanBo) || mapping.tyLePhanBo <= 0) {
        issues.push({
          level: 'error',
          scope: 'assessment',
          targetId: dot.id,
          message: `Tỷ lệ phân bổ của CLO "${mapping.cloId}" trong đợt "${dot.id}" phải lớn hơn 0.`
        })
      }
      tổngTyLe += mapping.tyLePhanBo

      const groups = groupsByClo.get(mapping.cloId) ?? new Set<AssessmentGroup>()
      if (dot.nhom === 'CC' || dot.nhom === 'GK' || dot.nhom === 'CK') groups.add(dot.nhom)
      groupsByClo.set(mapping.cloId, groups)
    }

    if (dot.cloList.length > 0 && Math.abs(roundHalfUp(tổngTyLe, 2) - 100) > 0.01) {
      issues.push({
        level: 'error',
        scope: 'assessment',
        targetId: dot.id,
        message: `Tổng tỷ lệ phân bổ CLO của đợt "${dot.id}" = ${roundHalfUp(tổngTyLe, 2)}%, phải bằng 100%.`
      })
    }

    if (dot.cachNhapDiem === 'QUESTION_SCORE' && dot.maDeList.length === 0) {
      issues.push({
        level: 'error',
        scope: 'assessment',
        targetId: dot.id,
        message: `Đợt "${dot.id}" nhập theo câu hỏi nhưng chưa khai báo mã đề nào.`
      })
    }

    if (dot.cachNhapDiem === 'ATTENDANCE' && (!dot.buoiDiemDanh || dot.buoiDiemDanh.length === 0)) {
      issues.push({
        level: 'warning',
        scope: 'assessment',
        targetId: dot.id,
        message: `Đợt "${dot.id}" nhập theo điểm danh nhưng chưa khai báo buổi nào.`
      })
    }
  }

  const totalWeight = dots.reduce((sum, dot) => sum + dot.trongSoPhanTram, 0)
  if (dots.every((dot) => Number.isInteger(dot.trongSoPhanTram)) && totalWeight !== 100) {
    issues.push({
      level: 'error',
      scope: 'assessment',
      message: `Tổng trọng số kế hoạch đánh giá = ${roundHalfUp(totalWeight, 2)}%, phải bằng 100%.`
    })
  }

  // CLO chỉ đo bằng chuyên cần/thái độ (Quyết định #7: không chặn)
  if (course.quyTac.canhBaoCcDonLe) {
    for (const clo of course.cloList) {
      const groups = groupsByClo.get(clo.id)
      if (groups && [...groups].every((g) => g === 'CC')) {
        issues.push({
          level: 'warning',
          scope: 'assessment',
          targetId: clo.maClo,
          message: `CLO "${clo.maClo}" chỉ được đo bằng chuyên cần/thái độ (nhóm CC).`,
          suggestion: 'Nên bổ sung đầu điểm khác nếu CLO này cần đánh giá năng lực tự chủ.'
        })
      }
    }
  }

  return issues
}
