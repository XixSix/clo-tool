/**
 * Validate điểm từng ô của sinh viên so với điểm tối đa trong Config.
 */

import type { CourseConfig, RawStudentRow, ValidationIssue } from '../../types'
import { isMultipleOfQuarter } from '../helpers'

/** Mỗi mã cột điểm chỉ lấy một điểm tối đa (Config validator đã đảm bảo nhất quán) */
export function buildMaxScoreByColumn(config: CourseConfig): Map<string, number> {
  const maxScoreByColumn = new Map<string, number>()
  for (const question of config.cauHoi) {
    if (!maxScoreByColumn.has(question.maCotDiem)) {
      maxScoreByColumn.set(question.maCotDiem, question.diemToiDa)
    }
  }
  return maxScoreByColumn
}

export function validateStudentScores(
  student: RawStudentRow,
  index: number,
  maxScoreByColumn: Map<string, number>
): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const row = student.excelRow ?? index + 1

  for (const [maCot, value] of Object.entries(student.diemCacCot)) {
    const max = maxScoreByColumn.get(maCot)
    if (max === undefined) continue

    if (value === null || value === undefined) {
      issues.push({
        level: 'warning',
        row,
        column: maCot,
        message: `SV ${student.maSv}: chưa nhập điểm cột "${maCot}".`
      })
      continue
    }
    if (value === 'VT') continue
    if (typeof value !== 'number') continue

    if (value < 0) {
      issues.push({
        level: 'error',
        row,
        column: maCot,
        message: `SV ${student.maSv}: điểm ${value} < 0.`
      })
    } else if (value > max) {
      issues.push({
        level: 'error',
        row,
        column: maCot,
        message: `SV ${student.maSv}: điểm ${value} > điểm tối đa ${max}.`
      })
    }

    // Điểm thi nên là bội của 0,25
    if (maCot !== 'CC' && maCot !== 'TD' && !isMultipleOfQuarter(value)) {
      issues.push({
        level: 'warning',
        row,
        column: maCot,
        message: `SV ${student.maSv}: điểm ${value} không phải bội của 0,25.`
      })
    }
  }

  return issues
}
