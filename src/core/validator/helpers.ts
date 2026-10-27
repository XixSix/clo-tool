/**
 * Tiện ích dùng chung cho bộ validator (tách module theo từng sheet).
 */

import type { QuestionColumn } from '../types'

export const EPSILON = 0.01

export function isMultipleOfQuarter(value: number): boolean {
  const quarters = value / 0.25
  return Math.abs(quarters - Math.round(quarters)) < 1e-9
}

/** Tổng điểm tối đa của từng đề (gộp theo đầu điểm + mã đề, không cộng trùng cột) */
export function examMaxScores(cauHoi: QuestionColumn[]): Record<string, number> {
  const groups = new Map<string, Map<string, number>>()
  for (const q of cauHoi) {
    // Trim mã và coi mã đề trống là ALL để gộp đúng đề
    const maDe = (q.maDe ?? 'ALL').trim() || 'ALL'
    const key = `${q.maDauDiem.trim()}|${maDe}`
    const columns = groups.get(key) ?? new Map<string, number>()
    // Một cột điểm có thể phục vụ nhiều CLO -> chỉ cộng một lần
    columns.set(q.maCotDiem.trim(), q.diemToiDa)
    groups.set(key, columns)
  }

  const result: Record<string, number> = {}
  for (const [key, columns] of groups.entries()) {
    result[key] = Array.from(columns.values()).reduce((sum, v) => sum + v, 0)
  }
  return result
}
