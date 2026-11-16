import { parseGradeSheet, validateCourse, validateGradeSheet } from '@core/index'
import type { Course, GradeSheetData, ValidationIssue } from '@core/types'

export interface LoadedConfig {
  config?: Course
  issues: ValidationIssue[]
  error?: string
}

/**
 * Cấu hình học phần được nhập trực tiếp trên ứng dụng dưới dạng model `Course`.
 * Không còn đọc từ file Excel cấu hình (đã bỏ phần IO config).
 */
export async function loadConfig(configSource: Course | string): Promise<LoadedConfig> {
  if (typeof configSource === 'string') {
    return {
      issues: [],
      error:
        'Cấu hình học phần được nhập trực tiếp trên ứng dụng, không còn đọc từ file Excel. Vui lòng mở màn Học phần để nhập cấu hình.'
    }
  }
  return { config: configSource, issues: validateCourse(configSource) }
}

export interface LoadedGradeSheet {
  file: GradeSheetData
  issues: ValidationIssue[]
}

export async function loadGradeSheet(course: Course, rawPath: string): Promise<LoadedGradeSheet> {
  const file = await parseGradeSheet(rawPath, course)
  const issues = validateGradeSheet(course, file)

  return { file, issues }
}
