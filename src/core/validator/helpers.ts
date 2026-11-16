/**
 * Tiện ích dùng chung cho bộ validator.
 */

import type { Course } from '../types'
import type { ValidationIssue } from '../types/validation'
import { examMaxScores as courseExamMaxScores } from '../utils/courseModel'

export const EPSILON = 0.01

/** Có ít nhất một lỗi chặn tính điểm (bỏ qua cảnh báo). */
export function hasErrors(issues: ValidationIssue[]): boolean {
  return issues.some((issue) => issue.level === 'error')
}

/** Đếm số lỗi và cảnh báo để hiển thị badge. */
export function countIssues(issues: ValidationIssue[]): { errors: number; warnings: number } {
  let errors = 0
  let warnings = 0
  for (const issue of issues) {
    if (issue.level === 'error') errors += 1
    else warnings += 1
  }
  return { errors, warnings }
}

export function isMultipleOfQuarter(value: number): boolean {
  const quarters = value / 0.25
  return Math.abs(quarters - Math.round(quarters)) < 1e-9
}

/** Tổng điểm tối đa của từng đề, khóa `đợtId|maDe` (bọc lại helper của courseModel). */
export function examMaxScoresOf(course: Course): Record<string, number> {
  return courseExamMaxScores(course)
}
