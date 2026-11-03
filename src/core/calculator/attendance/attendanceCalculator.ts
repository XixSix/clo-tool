/**
 * Tính điểm chuyên cần (CC) từ ký hiệu điểm danh.
 *
 * Công thức (đặc tả mục III.2):
 *   CC = (Σ hệ số của các buổi đã diễn ra) / (số buổi đã diễn ra) × 10
 *
 * - Buổi để trống = chưa diễn ra → không tính vào mẫu số.
 * - Ký hiệu lạ (không có trong sheet DIEM_DANH) → cảnh báo, tính hệ số 0.
 */

import type {
  AttendanceRecord,
  AttendanceRule,
  AttendanceScore,
  ValidationIssue
} from '../../types'
import { roundHalfUp } from '../../rules'

export interface AttendanceComputeResult {
  scores: AttendanceScore[]
  byMaSv: Record<string, number>
  issues: ValidationIssue[]
}

export function computeAttendanceScores(
  records: AttendanceRecord[],
  rules: AttendanceRule[]
): AttendanceComputeResult {
  const ruleMap = new Map(rules.map((r) => [r.kyHieu.trim().toUpperCase(), r.heSo]))
  const issues: ValidationIssue[] = []
  const scores: AttendanceScore[] = []
  const byMaSv: Record<string, number> = {}

  for (const record of records) {
    let heSoSum = 0
    let soBuoi = 0
    let soVangKhongPhep = 0
    let soVangCoPhep = 0
    const symbolsLa: string[] = []

    for (const [, rawSymbol] of Object.entries(record.symbols)) {
      const symbol = (rawSymbol ?? '').trim()
      if (symbol === '') continue // chưa diễn ra
      soBuoi++
      const key = symbol.toUpperCase()
      const heSo = ruleMap.get(key)
      if (heSo === undefined) {
        symbolsLa.push(symbol)
      } else {
        heSoSum += heSo
      }
      if (key === 'V') soVangKhongPhep++
      if (key === 'V-CP' || key === 'VCP') soVangCoPhep++
    }

    if (symbolsLa.length > 0) {
      issues.push({
        level: 'warning',
        message: `Mã điểm danh lạ của SV ${record.maSv}: ${symbolsLa.join(', ')} (tính hệ số 0).`,
        suggestion: 'Bổ sung ký hiệu này vào sheet DIEM_DANH của file Config.'
      })
    }

    const rawScore = soBuoi > 0 ? (heSoSum / soBuoi) * 10 : 0
    const score = roundHalfUp(rawScore, 1)
    byMaSv[record.maSv] = score
    scores.push({
      maSv: record.maSv,
      score,
      soBuoi,
      soVangKhongPhep,
      soVangCoPhep,
      symbolsLa
    })
  }

  return { scores, byMaSv, issues }
}
