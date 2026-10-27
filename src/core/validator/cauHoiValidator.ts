/**
 * Validate sheet CAU_HOI — khai báo cột điểm / câu hỏi thi.
 */

import type { CourseConfig, ValidationIssue } from '../types'
import { isMultipleOfQuarter } from './helpers'
import { roundHalfUp } from '../rules'

const VALID_LOAI = new Set(['TL', 'TN'])

export function validateCauHoi(config: CourseConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  if (config.cauHoi.length === 0) {
    issues.push({
      level: 'error',
      sheet: 'CAU_HOI',
      message: 'Chưa khai báo câu hỏi hoặc cột điểm nào.'
    })
  }

  const maxByColumn = new Map<string, number>()
  const cellColumns = new Map<string, Set<string>>()
  const examQuestions = new Map<string, Set<string>>()

  for (const q of config.cauHoi) {
    if (!Number.isFinite(q.diemToiDa) || q.diemToiDa <= 0) {
      issues.push({
        level: 'error',
        sheet: 'CAU_HOI',
        column: q.maCotDiem,
        message: `Điểm tối đa của cột "${q.maCotDiem}" phải lớn hơn 0.`
      })
    }

    // 1. Cùng một cột điểm khai điểm tối đa khác nhau -> không xác định được chuẩn
    if (maxByColumn.has(q.maCotDiem) && maxByColumn.get(q.maCotDiem) !== q.diemToiDa) {
      issues.push({
        level: 'error',
        sheet: 'CAU_HOI',
        column: q.maCotDiem,
        message: `Cột điểm "${q.maCotDiem}" được khai với điểm tối đa khác nhau (${maxByColumn.get(q.maCotDiem)} và ${q.diemToiDa}).`
      })
    } else {
      maxByColumn.set(q.maCotDiem, q.diemToiDa)
    }

    // 2. Cùng một cột điểm dùng cho nhiều câu trong CÙNG ô (đầu điểm – CLO) -> điểm bị đếm đè
    const cellKey = `${q.maDauDiem}|${q.clo}`
    const columns = cellColumns.get(cellKey) ?? new Set<string>()
    if (columns.has(q.maCotDiem)) {
      issues.push({
        level: 'error',
        sheet: 'CAU_HOI',
        column: q.maCotDiem,
        message: `Cột điểm "${q.maCotDiem}" được dùng cho nhiều câu trong cùng ô (đầu điểm "${q.maDauDiem}" – CLO "${q.clo}") làm trùng lặp điểm.`
      })
    }
    columns.add(q.maCotDiem)
    cellColumns.set(cellKey, columns)

    // 3. Trùng tên câu trong cùng đề (đầu điểm + mã đề) -> psychometrics gộp mất câu
    const examKey = `${q.maDauDiem}|${q.maDe ?? 'ALL'}`
    const cauNames = examQuestions.get(examKey) ?? new Set<string>()
    if (cauNames.has(q.cau)) {
      issues.push({
        level: 'error',
        sheet: 'CAU_HOI',
        column: q.maCotDiem,
        message: `Câu "${q.cau}" bị trùng tên trong đề ${q.maDauDiem}/${q.maDe ?? 'ALL'}.`
      })
    }
    cauNames.add(q.cau)
    examQuestions.set(examKey, cauNames)

    // --- Cảnh báo ---

    // Điểm tối đa câu phải là bội của 0,25
    if (q.diemToiDa > 0 && !isMultipleOfQuarter(q.diemToiDa)) {
      issues.push({
        level: 'warning',
        sheet: 'CAU_HOI',
        column: q.maCotDiem,
        message: `Điểm tối đa ${q.diemToiDa} của cột "${q.maCotDiem}" không phải bội của 0,25.`
      })
    }

    if (!q.maDe || q.maDe.trim() === '') {
      issues.push({
        level: 'warning',
        sheet: 'CAU_HOI',
        column: q.maCotDiem,
        message: `Câu "${q.cau}" (cột "${q.maCotDiem}") chưa khai mã đề — sẽ coi là áp dụng cho mọi đề (ALL).`
      })
    }

    if (q.loai !== undefined && !VALID_LOAI.has(q.loai)) {
      issues.push({
        level: 'warning',
        sheet: 'CAU_HOI',
        column: q.maCotDiem,
        message: `Loại câu hỏi "${q.loai}" của cột "${q.maCotDiem}" không thuộc TN/TL.`
      })
    }
  }

  // Tổng điểm câu đo CLO tham gia PLO phải > 50% điểm bài thi (QĐ450 Điều 3.4)
  if (config.maTranPlo.length > 0) {
    const ploClos = new Set(config.maTranPlo.map((m) => m.clo))
    const totals = new Map<string, { total: number; columns: Set<string> }>()
    for (const q of config.cauHoi) {
      const key = `${q.maDauDiem}|${q.maDe ?? 'ALL'}`
      const entry = totals.get(key) ?? { total: 0, columns: new Set<string>() }
      // Một cột điểm có thể phục vụ nhiều CLO -> chỉ cộng một lần
      if (!entry.columns.has(q.maCotDiem)) {
        entry.total += q.diemToiDa
        entry.columns.add(q.maCotDiem)
        totals.set(key, entry)
      }
    }
    for (const [key, entry] of totals.entries()) {
      const [maDauDiem, maDe] = key.split('|')
      // Tính theo cột duy nhất để không cộng trùng
      const unique = new Map(
        config.cauHoi
          .filter((q) => q.maDauDiem === maDauDiem && (q.maDe ?? 'ALL') === maDe)
          .map((q) => [q.maCotDiem, q])
      )
      const ploTotal = Array.from(unique.values())
        .filter((q) => ploClos.has(q.clo))
        .reduce((sum, q) => sum + q.diemToiDa, 0)
      if (entry.total > 0 && ploTotal / entry.total <= 0.5) {
        issues.push({
          level: 'warning',
          sheet: 'CAU_HOI',
          message: `Đề ${maDauDiem}/${maDe}: điểm các câu đo CLO tham gia đánh giá PLO chỉ chiếm ${roundHalfUp((ploTotal / entry.total) * 100, 1)}% (≤ 50%).`
        })
      }
    }
  }

  return issues
}
