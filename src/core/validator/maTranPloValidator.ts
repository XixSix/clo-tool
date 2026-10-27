/**
 * Validate sheet MA_TRAN_PLO — ma trận ánh xạ PLO/PI ↔ CLO.
 *
 * Lưu ý: PI chỉ dùng để hiển thị, không tham gia tính điểm PLO
 * (`calculatePloScores` chỉ dùng PLO + CLO và dedupe CLO). Vì vậy các lỗi
 * liên quan PI chủ yếu là warning, trừ mâu thuẫn rõ ràng như 1 PI thuộc 2 PLO.
 */

import type { CourseConfig, ValidationIssue } from '../types'

const PLO_PATTERN = /^PLO\d+$/
const PI_PATTERN = /^PI\d+\.\d+$/

export function validateMaTranPlo(config: CourseConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const ploMatrix = config.maTranPlo

  if (ploMatrix.length === 0) {
    issues.push({
      level: 'error',
      sheet: 'MA_TRAN_PLO',
      message: 'Chưa khai báo ánh xạ PLO/PI/CLO nào.'
    })
  }

  // Gom dữ liệu trong 1 lượt duyệt:
  // - seen:         bộ ba (PLO, PI, CLO) để bắt lặp
  // - plosByPi:     PI -> các PLO đang dùng PI đó
  // - pisByCloPlo:  "PLO|CLO" -> các PI cùng gán cho CLO đó
  const seen = new Set<string>()
  const plosByPi = new Map<string, Set<string>>()
  const pisByCloPlo = new Map<string, Set<string>>()

  for (const m of ploMatrix) {
    const hasPlo = !!m.plo && m.plo.trim() !== ''
    const hasPi = !!m.pi && m.pi.trim() !== ''
    const hasClo = !!m.clo && m.clo.trim() !== ''

    // Đủ dữ liệu bắt buộc
    if (!hasPlo) {
      issues.push({ level: 'error', sheet: 'MA_TRAN_PLO', column: 'PLO', message: 'Thiếu mã PLO.' })
    }
    if (!hasPi) {
      issues.push({ level: 'error', sheet: 'MA_TRAN_PLO', column: 'PI', message: 'Thiếu mã PI.' })
    }
    if (!hasClo) {
      issues.push({ level: 'error', sheet: 'MA_TRAN_PLO', column: 'CLO', message: 'Thiếu mã CLO.' })
    }

    // Định dạng mã
    if (hasPlo && !PLO_PATTERN.test(m.plo.trim())) {
      issues.push({
        level: 'warning',
        sheet: 'MA_TRAN_PLO',
        column: 'PLO',
        message: `Mã PLO "${m.plo}" không đúng dạng PLO<số> (ví dụ PLO2).`
      })
    }
    if (hasPi && !PI_PATTERN.test(m.pi.trim())) {
      issues.push({
        level: 'warning',
        sheet: 'MA_TRAN_PLO',
        column: 'PI',
        message: `Mã PI "${m.pi}" không đúng dạng PI<số>.<số> (ví dụ PI2.1).`
      })
    }

    // Số hiệu PI phải khớp PLO: PI2.x phải thuộc PLO2
    if (hasPlo && hasPi && PLO_PATTERN.test(m.plo.trim()) && PI_PATTERN.test(m.pi.trim())) {
      const piNumber = m.pi.trim().slice(2).split('.')[0]
      const ploNumber = m.plo.trim().slice(3)
      if (piNumber !== ploNumber) {
        issues.push({
          level: 'warning',
          sheet: 'MA_TRAN_PLO',
          column: 'PI',
          message: `PI "${m.pi}" không khớp PLO "${m.plo}" — PI phải thuộc đúng PLO theo số hiệu (PI${ploNumber}.x).`
        })
      }
    }

    // 1 PI chỉ thuộc 1 PLO
    if (hasPlo && hasPi) {
      const plos = plosByPi.get(m.pi) ?? new Set<string>()
      plos.add(m.plo)
      plosByPi.set(m.pi, plos)
    }

    // 1 CLO trong cùng PLO nên chỉ gắn 1 PI
    if (hasPlo && hasPi && hasClo) {
      const key = `${m.plo}|${m.clo}`
      const pis = pisByCloPlo.get(key) ?? new Set<string>()
      pis.add(m.pi)
      pisByCloPlo.set(key, pis)
    }

    // Bộ ba (PLO, PI, CLO) bị lặp
    if (hasPlo && hasPi && hasClo) {
      const key = `${m.plo}|${m.pi}|${m.clo}`
      if (seen.has(key)) {
        issues.push({
          level: 'error',
          sheet: 'MA_TRAN_PLO',
          message: `Ánh xạ (PLO "${m.plo}", PI "${m.pi}", CLO "${m.clo}") bị lặp làm trùng lặp dữ liệu.`
        })
      }
      seen.add(key)
    }
  }

  // Báo lỗi PI nằm ở nhiều PLO (mỗi PI chỉ phát 1 issue)
  for (const [pi, plos] of plosByPi) {
    if (plos.size > 1) {
      issues.push({
        level: 'error',
        sheet: 'MA_TRAN_PLO',
        column: 'PI',
        message: `PI "${pi}" được dùng ở nhiều PLO (${[...plos].join(', ')}).`
      })
    }
  }

  // Cảnh báo CLO gắn nhiều PI trong cùng PLO (không ảnh hưởng điểm, chỉ nhập nhằng)
  for (const [key, pis] of pisByCloPlo) {
    if (pis.size > 1) {
      const [plo, clo] = key.split('|')
      issues.push({
        level: 'warning',
        sheet: 'MA_TRAN_PLO',
        column: 'PI',
        message: `CLO "${clo}" được gán cho nhiều PI trong PLO "${plo}" (${[...pis].join(', ')}).`
      })
    }
  }

  return issues
}
