/**
 * Validate điểm từng ô của sinh viên so với điểm tối đa trong Config.
 */

import type { CourseConfig, RawStudentRow, ValidationIssue } from '../../types'
import { maxScoreOfColumn, scoreColumnsFromConfig } from '../../utils/scoreColumns'
import { isMultipleOfQuarter } from '../helpers'

/** Mỗi mã cột điểm chỉ lấy một điểm tối đa; cột điểm trực tiếp mặc định thang 10 */
export function buildMaxScoreByColumn(config: CourseConfig): Map<string, number> {
  const maxScoreByColumn = new Map<string, number>()
  for (const maCot of scoreColumnsFromConfig(config)) {
    maxScoreByColumn.set(maCot, maxScoreOfColumn(config, maCot))
  }
  return maxScoreByColumn
}

export function validateScores(
  students: RawStudentRow[],
  maxScoreByColumn: Map<string, number>,
  studentExcelRows: number[] = [],
  autoComputedColumns: ReadonlySet<string> = new Set()
): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  students.forEach((student, index) => {
    const row = studentExcelRows[index] ?? student.student.tt ?? index + 1
    const maSv = student.student.maSv

    for (const [maCot, value] of Object.entries(student.scores.diemCacCot)) {
      const max = maxScoreByColumn.get(maCot)
      if (max === undefined) continue

      if (value === null || value === undefined) {
        // Cột sẽ được tính tự động từ điểm danh nên không báo thiếu.
        if (autoComputedColumns.has(maCot)) continue
        issues.push({
          level: 'warning',
          row,
          column: maCot,
          message: `SV ${maSv}: chưa nhập điểm cột "${maCot}".`
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
          message: `SV ${maSv}: điểm ${value} < 0.`
        })
      } else if (value > max) {
        issues.push({
          level: 'error',
          row,
          column: maCot,
          message: `SV ${maSv}: điểm ${value} > điểm tối đa ${max}.`
        })
      }

      // Điểm thi nên là bội của 0,25
      if (maCot !== 'CC' && maCot !== 'TD' && !isMultipleOfQuarter(value)) {
        issues.push({
          level: 'warning',
          row,
          column: maCot,
          message: `SV ${maSv}: điểm ${value} không phải bội của 0,25.`
        })
      }
    }
  })

  return issues
}
