import { parseRawGrades, validateCourse, validateRawGrades } from '@core/index'
import type { Course, RawGrades, ValidationIssue } from '@core/types'

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

export interface LoadedRawGrades {
  file: RawGrades
  issues: ValidationIssue[]
}

export async function loadRawGrades(course: Course, rawPath: string): Promise<LoadedRawGrades> {
  const file = await parseRawGrades(rawPath, course)
  const issues = validateRawGrades(course, file)

  return { file, issues }
}
