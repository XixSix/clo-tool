import { parseGradeSheet, validateCourse, validateGradeSheet } from '@core/index'
import type { Course, GradeSheetData, ValidationIssue } from '@core/types'

export interface LoadedConfig {
  config: Course
  issues: ValidationIssue[]
}

/** Cấu hình học phần do ứng dụng dựng trong bộ nhớ (không đọc từ file Excel). */
export function loadConfig(course: Course): LoadedConfig {
  return { config: course, issues: validateCourse(course) }
}

export interface LoadedGradeSheet {
  file: GradeSheetData
  issues: ValidationIssue[]
}

export async function loadGradeSheet(course: Course, gradeSheetPath: string): Promise<LoadedGradeSheet> {
  const file = await parseGradeSheet(gradeSheetPath, course)
  const issues = validateGradeSheet(course, file)

  return { file, issues }
}
