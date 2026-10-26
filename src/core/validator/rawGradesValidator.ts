/**
 * Validate file điểm thô (DIEM_COT_DIEM) đối chiếu với cấu hình câu hỏi.
 */

import type { CourseConfig, RawGradesFile, ValidationIssue } from '../types'
import { isMultipleOfQuarter } from './helpers'

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
      if (maCot !== 'CC' && maCot !== 'TD' && !isMultipleOfQuarter(value as number)) {
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
