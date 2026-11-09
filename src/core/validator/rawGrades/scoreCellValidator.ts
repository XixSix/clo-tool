/**
 * Validate điểm từng ô của sinh viên so với điểm tối đa khai báo trong Course.
 */

import type { Course, RawStudentRow, ValidationIssue } from '../../types'
import { maxScoreByColumn } from '../../utils/courseModel'
import { isMultipleOfQuarter } from '../helpers'

/** Điểm tối đa theo từng mã cột điểm (Config validator đã đảm bảo nhất quán). */
export function buildMaxScoreByColumn(course: Course): Map<string, number> {
  return maxScoreByColumn(course)
}

export function validateStudentScores(
  student: RawStudentRow,
  row: number,
  maxByColumn: Map<string, number>
): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const maSv = student.student.maSv

  for (const [maCot, value] of Object.entries(student.scores.diemCacCot)) {
    const max = maxByColumn.get(maCot)
    if (max === undefined) continue

    if (value === null || value === undefined) {
      issues.push({
        level: 'warning',
        scope: 'raw_grades',
        row,
        column: maCot,
        message: `SV ${maSv}: ô điểm "${maCot}" đang trống (tính 0 theo Quyết định #9).`
      })
      continue
    }
    if (value === 'VT') continue

    if (!Number.isFinite(value) || value < 0) {
      issues.push({
        level: 'error',
        scope: 'raw_grades',
        row,
        column: maCot,
        message: `SV ${maSv}: điểm "${maCot}" = ${value} không hợp lệ (phải ≥ 0).`
      })
      continue
    }

    if (value > max) {
      issues.push({
        level: 'error',
        scope: 'raw_grades',
        row,
        column: maCot,
        message: `SV ${maSv}: điểm "${maCot}" = ${value} vượt quá điểm tối đa ${max}.`
      })
    }

    if (!isMultipleOfQuarter(value)) {
      issues.push({
        level: 'warning',
        scope: 'raw_grades',
        row,
        column: maCot,
        message: `SV ${maSv}: điểm "${maCot}" = ${value} không phải bội của 0,25.`
      })
    }
  }

  return issues
}
