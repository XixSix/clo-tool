/**
 * Tiện ích dùng chung cho bộ validator.
 */

import type { Course } from '../types'
import { examMaxScores as courseExamMaxScores } from '../utils/courseModel'

export const EPSILON = 0.01

export function isMultipleOfQuarter(value: number): boolean {
  const quarters = value / 0.25
  return Math.abs(quarters - Math.round(quarters)) < 1e-9
}

/** Tổng điểm tối đa của từng đề, khóa `đợtId|maDe` (bọc lại helper của courseModel). */
export function examMaxScoresOf(course: Course): Record<string, number> {
  return courseExamMaxScores(course)
}
