/**
 * Kiểm tra hợp lệ dữ liệu (đặc tả mục V).
 *
 * Phân biệt:
 * - Lỗi (error): không cho tính tiếp.
 * - Cảnh báo (warning): vẫn tính, ghi vào sheet CANH_BAO.
 *
 * Mọi thông báo cố gắng chỉ rõ sheet/dòng/cột.
 */

import type { CourseConfig, QuestionColumn, RawGradesFile, ValidationIssue } from './types'
import { roundHalfUp } from './rules'

const EPSILON = 0.01

function isMultipleOfQuarter(value: number): boolean {
  const quarters = value / 0.25
  return Math.abs(quarters - Math.round(quarters)) < 1e-9
}

/** Tổng điểm tối đa của từng đề (gộp theo đầu điểm + mã đề, không cộng trùng cột) */
export function examMaxScores(cauHoi: QuestionColumn[]): Record<string, number> {
  const groups = new Map<string, Map<string, number>>()
  for (const q of cauHoi) {
    const key = `${q.maDauDiem}|${q.maDe ?? 'ALL'}`
    const columns = groups.get(key) ?? new Map<string, number>()
    // Một cột điểm có thể phục vụ nhiều CLO -> chỉ cộng một lần
    columns.set(q.maCotDiem, q.diemToiDa)
    groups.set(key, columns)
  }

  const result: Record<string, number> = {}
  for (const [key, columns] of groups.entries()) {
    result[key] = Array.from(columns.values()).reduce((sum, v) => sum + v, 0)
  }
  return result
}

export function validateConfig(config: CourseConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const rules = config.quyTac
  const cloCodes = new Set(config.cloList.map((c) => c.maClo))

  if (config.cloList.length === 0) {
    issues.push({ level: 'error', sheet: 'CLO_LIST', message: 'Chưa khai báo CLO nào.' })
  }

  // 1. Tổng trọng số kế hoạch đánh giá
  const totalWeight = config.keHoachDanhGia.reduce((sum, p) => sum + p.trongSoPhanTram, 0)
  if (Math.abs(totalWeight - 100) > EPSILON) {
    issues.push({
      level: 'error',
      sheet: 'KE_HOACH_DANH_GIA',
      column: 'Trong_So_Phan_Tram',
      message: `Tổng trọng số kế hoạch đánh giá = ${roundHalfUp(totalWeight, 2)}%, phải bằng 100%.`
    })
  }

  // 2. Mã CLO phải tồn tại trong CLO_LIST
  const checkClo = (clo: string, sheet: string, row?: number): void => {
    if (clo && !cloCodes.has(clo)) {
      issues.push({
        level: 'error',
        sheet,
        row,
        column: 'CLO',
        message: `Mã CLO "${clo}" không có trong sheet CLO_LIST.`
      })
    }
  }

  config.keHoachDanhGia.forEach((p, idx) => checkClo(p.clo, 'KE_HOACH_DANH_GIA', idx + 2))
  config.cauHoi.forEach((q, idx) => checkClo(q.clo, 'CAU_HOI', idx + 2))
  config.maTranPlo.forEach((m, idx) => checkClo(m.clo, 'MA_TRAN_PLO', idx + 2))

  // 3. Cặp (đầu điểm, CLO) phải khớp giữa KE_HOACH_DANH_GIA và CAU_HOI
  const planKeys = new Set(config.keHoachDanhGia.map((p) => `${p.maDauDiem}|${p.clo}`))
  const questionKeys = new Set(config.cauHoi.map((q) => `${q.maDauDiem}|${q.clo}`))

  for (const key of questionKeys) {
    if (!planKeys.has(key)) {
      const [maDauDiem, clo] = key.split('|')
      issues.push({
        level: 'error',
        sheet: 'CAU_HOI',
        message: `Cặp đầu điểm "${maDauDiem}" – CLO "${clo}" có trong CAU_HOI nhưng không có trong KE_HOACH_DANH_GIA.`
      })
    }
  }
  for (const key of planKeys) {
    if (!questionKeys.has(key)) {
      const [maDauDiem, clo] = key.split('|')
      issues.push({
        level: 'error',
        sheet: 'KE_HOACH_DANH_GIA',
        message: `Cặp đầu điểm "${maDauDiem}" – CLO "${clo}" có trong kế hoạch nhưng không có cột điểm tương ứng trong CAU_HOI.`
      })
    }
  }

  // 4. CLO không được đầu điểm nào đo
  const measuredClo = new Set(config.keHoachDanhGia.map((p) => p.clo))
  for (const clo of config.cloList) {
    if (!measuredClo.has(clo.maClo)) {
      issues.push({
        level: 'error',
        sheet: 'CLO_LIST',
        message: `CLO "${clo.maClo}" không được đầu điểm nào đo.`
      })
    }
  }

  // 5. Tổng điểm tối đa mỗi đề phải bằng 10
  for (const [key, total] of Object.entries(examMaxScores(config.cauHoi))) {
    if (Math.abs(total - 10) > EPSILON) {
      const [maDauDiem, maDe] = key.split('|')
      issues.push({
        level: 'error',
        sheet: 'CAU_HOI',
        message: `Tổng điểm tối đa của đề ${maDauDiem}/${maDe} = ${roundHalfUp(total, 2)}, phải bằng 10.`
      })
    }
  }

  // --- Cảnh báo ---

  // CLO chỉ đo bằng chuyên cần/thái độ (Quyết định #7: không chặn)
  if (rules.canh_bao_cc_don_le) {
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

  // CLO chưa gắn PI/PLO
  const mappedClo = new Set(config.maTranPlo.map((m) => m.clo))
  for (const clo of config.cloList) {
    if (!mappedClo.has(clo.maClo)) {
      issues.push({
        level: 'warning',
        sheet: 'MA_TRAN_PLO',
        message: `CLO "${clo.maClo}" chưa được ánh xạ tới PI/PLO nào.`
      })
    }
  }

  // Điểm tối đa câu phải là bội của 0,25
  for (const q of config.cauHoi) {
    if (q.diemToiDa > 0 && !isMultipleOfQuarter(q.diemToiDa)) {
      issues.push({
        level: 'warning',
        sheet: 'CAU_HOI',
        column: q.maCotDiem,
        message: `Điểm tối đa ${q.diemToiDa} của cột "${q.maCotDiem}" không phải bội của 0,25.`
      })
    }
  }

  // Tổng điểm câu đo CLO tham gia PLO phải > 50% điểm bài thi (QĐ450 Điều 3.4)
  if (config.maTranPlo.length > 0) {
    const ploClos = new Set(config.maTranPlo.map((m) => m.clo))
    for (const [key, total] of Object.entries(examMaxScores(config.cauHoi))) {
      const [maDauDiem, maDe] = key.split('|')
      const questions = config.cauHoi.filter(
        (q) => q.maDauDiem === maDauDiem && (q.maDe ?? 'ALL') === maDe
      )
      const unique = new Map(questions.map((q) => [q.maCotDiem, q]))
      const ploScore = Array.from(unique.values())
        .filter((q) => ploClos.has(q.clo))
        .reduce((sum, q) => sum + q.diemToiDa, 0)
      if (total > 0 && ploScore / total <= 0.5) {
        issues.push({
          level: 'warning',
          sheet: 'CAU_HOI',
          message: `Đề ${maDauDiem}/${maDe}: điểm các câu đo CLO tham gia đánh giá PLO chỉ chiếm ${roundHalfUp((ploScore / total) * 100, 1)}% (≤ 50%).`
        })
      }
    }
  }

  return issues
}

export function validateRawGrades(config: CourseConfig, file: RawGradesFile): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const maxScoreByColumn = new Map<string, number>()
  for (const q of config.cauHoi) {
    if (!maxScoreByColumn.has(q.maCotDiem)) {
      maxScoreByColumn.set(q.maCotDiem, q.diemToiDa)
    }
  }

  const seenMaSv = new Set<string>()

  file.students.forEach((st, idx) => {
    const row = idx + 1

    if (!st.maSv || st.maSv.startsWith('__MISSING_')) {
      issues.push({ level: 'error', row, column: 'Mã SV', message: 'Thiếu Mã SV.' })
    } else if (seenMaSv.has(st.maSv)) {
      issues.push({
        level: 'error',
        row,
        column: 'Mã SV',
        message: `Mã SV "${st.maSv}" bị trùng.`
      })
    } else {
      seenMaSv.add(st.maSv)
    }

    if (!st.hoTen || st.hoTen.trim() === '') {
      issues.push({ level: 'error', row, column: 'Họ và tên', message: 'Thiếu họ tên.' })
    }

    for (const [maCot, value] of Object.entries(st.diemCacCot)) {
      const max = maxScoreByColumn.get(maCot)
      if (max === undefined) continue

      if (value === null || value === undefined) {
        issues.push({
          level: 'warning',
          row,
          column: maCot,
          message: `SV ${st.maSv}: chưa nhập điểm cột "${maCot}".`
        })
        continue
      }
      if (value === 'VT') continue

      if (value < 0) {
        issues.push({
          level: 'error',
          row,
          column: maCot,
          message: `SV ${st.maSv}: điểm ${value} < 0.`
        })
      } else if (value > max) {
        issues.push({
          level: 'error',
          row,
          column: maCot,
          message: `SV ${st.maSv}: điểm ${value} > điểm tối đa ${max}.`
        })
      }

      // Điểm thi nên là bội của 0,25
      if (maCot !== 'CC' && maCot !== 'TD' && !isMultipleOfQuarter(value)) {
        issues.push({
          level: 'warning',
          row,
          column: maCot,
          message: `SV ${st.maSv}: điểm ${value} không phải bội của 0,25.`
        })
      }
    }
  })

  if (file.students.length < config.quyTac.nguong_co_mau_n) {
    issues.push({
      level: 'warning',
      message: `Quy mô lớp N = ${file.students.length} < ${config.quyTac.nguong_co_mau_n}: các chỉ số p, d, α kém tin cậy.`
    })
  }

  if (file.attendanceSessions.length === 0) {
    issues.push({
      level: 'warning',
      message: 'File điểm thô không có cột điểm danh (Buổi 1..N). Điểm CC phải nhập tay.'
    })
  }

  return issues
}
