/**
 * Validate ma trận ánh xạ PLO / PLO thành phần / PI / CLO (khối `plo`).
 *
 * Cấu trúc phân cấp:
 *   PLO → PartialPLO (ploThanhPhan) → PerformanceIndicator (PI) → CLO
 *
 * Lưu ý: PI/PLO thành phần dùng để tính và hiển thị điểm; các lỗi tham chiếu
 * (trỏ tới id không tồn tại) là lỗi chặn tính, còn lỗi định dạng mã là cảnh báo.
 */

import type { Course, ValidationIssue } from '../../types'

const PLO_PATTERN = /^PLO\d+$/
const PI_PATTERN = /^PI\d+\.\d+$/

export function validatePlo(course: Course): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const { ploList, ploThanhPhanList, piList, cloList } = course

  if (ploList.length === 0) {
    issues.push({
      level: 'error',
      scope: 'plo',
      message: 'Chưa khai báo ánh xạ PLO/PI/CLO nào.'
    })
  }

  const cloIds = new Set(cloList.map((c) => c.id))
  const partialIds = new Set(ploThanhPhanList.map((p) => p.id))
  const piIds = new Set(piList.map((p) => p.id))

  const seenPloCode = new Set<string>()
  for (const plo of ploList) {
    if (!plo.maPlo || plo.maPlo.trim() === '') {
      issues.push({
        level: 'error',
        scope: 'plo',
        targetId: 'maPlo',
        message: 'Thiếu mã PLO.'
      })
    } else {
      if (!PLO_PATTERN.test(plo.maPlo.trim())) {
        issues.push({
          level: 'warning',
          scope: 'plo',
          targetId: plo.maPlo,
          message: `Mã PLO "${plo.maPlo}" không đúng dạng PLO<số> (ví dụ PLO2).`
        })
      }
      if (seenPloCode.has(plo.maPlo)) {
        issues.push({
          level: 'error',
          scope: 'plo',
          targetId: plo.maPlo,
          message: `Mã PLO "${plo.maPlo}" bị lặp.`
        })
      }
      seenPloCode.add(plo.maPlo)
    }

    if (plo.ploThanhPhanIds.length === 0) {
      issues.push({
        level: 'error',
        scope: 'plo',
        targetId: plo.maPlo,
        message: `PLO "${plo.maPlo}" chưa có PLO thành phần nào.`
      })
    }
    for (const partialId of plo.ploThanhPhanIds) {
      if (!partialIds.has(partialId)) {
        issues.push({
          level: 'error',
          scope: 'plo',
          targetId: plo.maPlo,
          message: `PLO "${plo.maPlo}" trỏ tới PLO thành phần không tồn tại ("${partialId}").`
        })
      }
    }
  }

  const piToPlo = new Map<string, Set<string>>()
  const pisByCloPlo = new Map<string, Set<string>>()

  for (const partial of ploThanhPhanList) {
    const plo = ploList.find((p) => p.id === partial.maPlo)
    if (!plo && partial.maPlo) {
      issues.push({
        level: 'error',
        scope: 'plo',
        targetId: partial.maPloThanhPhan,
        message: `PLO thành phần "${partial.maPloThanhPhan}" trỏ tới PLO không tồn tại ("${partial.maPlo}").`
      })
    }

    if (partial.piIds.length === 0) {
      issues.push({
        level: 'warning',
        scope: 'plo',
        targetId: partial.maPloThanhPhan,
        message: `PLO thành phần "${partial.maPloThanhPhan}" chưa có PI nào.`
      })
    }

    for (const piId of partial.piIds) {
      if (!piIds.has(piId)) {
        issues.push({
          level: 'error',
          scope: 'plo',
          targetId: partial.maPloThanhPhan,
          message: `PLO thành phần "${partial.maPloThanhPhan}" trỏ tới PI không tồn tại ("${piId}").`
        })
        continue
      }
      const ploCode = partial.maPlo ? ploList.find((p) => p.id === partial.maPlo)?.maPlo : undefined
      if (ploCode) {
        const set = piToPlo.get(piId) ?? new Set<string>()
        set.add(ploCode)
        piToPlo.set(piId, set)
      }
    }
  }

  for (const pi of piList) {
    if (!pi.maPi || pi.maPi.trim() === '') {
      issues.push({
        level: 'error',
        scope: 'plo',
        targetId: 'maPi',
        message: 'Thiếu mã PI.'
      })
    } else if (!PI_PATTERN.test(pi.maPi.trim())) {
      issues.push({
        level: 'warning',
        scope: 'plo',
        targetId: pi.maPi,
        message: `Mã PI "${pi.maPi}" không đúng dạng PI<số>.<số> (ví dụ PI2.1).`
      })
    }

    if (pi.cloIds.length === 0) {
      issues.push({
        level: 'warning',
        scope: 'plo',
        targetId: pi.maPi,
        message: `PI "${pi.maPi}" chưa gán CLO nào.`
      })
    }
    for (const cloId of pi.cloIds) {
      if (!cloIds.has(cloId)) {
        issues.push({
          level: 'error',
          scope: 'plo',
          targetId: pi.maPi,
          message: `PI "${pi.maPi}" trỏ tới CLO không tồn tại ("${cloId}").`
        })
      }
    }

    // Một PI chỉ thuộc một PLO
    const plos = piToPlo.get(pi.id)
    if (plos && plos.size > 1) {
      issues.push({
        level: 'error',
        scope: 'plo',
        targetId: pi.maPi,
        message: `PI "${pi.maPi}" được dùng ở nhiều PLO (${[...plos].join(', ')}).`
      })
    }

    // Số hiệu PI phải khớp PLO: PI2.x phải thuộc PLO2
    if (plos && plos.size === 1 && PI_PATTERN.test(pi.maPi.trim())) {
      const ploCode = [...plos][0]
      if (PLO_PATTERN.test(ploCode)) {
        const piNumber = pi.maPi.trim().slice(2).split('.')[0]
        const ploNumber = ploCode.slice(3)
        if (piNumber !== ploNumber) {
          issues.push({
            level: 'warning',
            scope: 'plo',
            targetId: pi.maPi,
            message: `PI "${pi.maPi}" không khớp PLO "${ploCode}" — PI phải thuộc đúng PLO theo số hiệu (PI${ploNumber}.x).`
          })
        }
      }
    }

    // Một CLO trong cùng PLO nên chỉ gắn 1 PI
    if (plos && plos.size === 1) {
      const ploCode = [...plos][0]
      for (const cloId of pi.cloIds) {
        const key = `${ploCode}|${cloId}`
        const pis = pisByCloPlo.get(key) ?? new Set<string>()
        pis.add(pi.maPi)
        pisByCloPlo.set(key, pis)
      }
    }
  }

  for (const [key, pis] of pisByCloPlo) {
    if (pis.size > 1) {
      const [plo, cloId] = key.split('|')
      const clo = cloList.find((c) => c.id === cloId)
      issues.push({
        level: 'warning',
        scope: 'plo',
        targetId: plo,
        message: `CLO "${clo?.maClo ?? cloId}" được gán cho nhiều PI trong PLO "${plo}" (${[...pis].join(', ')}).`
      })
    }
  }

  return issues
}
