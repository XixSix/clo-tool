/**
 * Validate các chỉ tiêu ở mức toàn lớp của file điểm thô.
 */

import type { ValidationIssue } from '../../types'

export function validateClassLevel(
  studentCount: number,
  nguongCoMauN: number
): ValidationIssue[] {
  if (studentCount < nguongCoMauN) {
    return [
      {
        level: 'warning',
        message: `Quy mô lớp N = ${studentCount} < ${nguongCoMauN}: các chỉ số p, d, α kém tin cậy.`
      }
    ]
  }

  return []
}
