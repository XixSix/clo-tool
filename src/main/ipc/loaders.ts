import {
  applyAttendance,
  parseCourseConfig,
  parseRawGrades,
  validateConfig,
  validateRawGrades
} from '@core/index'
import type { CourseConfig, RawGrades, ValidationIssue } from '@core/types'

export interface LoadedConfig {
  config?: CourseConfig
  issues: ValidationIssue[]
  error?: string
}

export async function loadConfig(configPath: string): Promise<LoadedConfig> {
  try {
    const config = await parseCourseConfig(configPath)
    return { config, issues: validateConfig(config) }
  } catch (error) {
    return {
      issues: [],
      error: error instanceof Error ? error.message : 'Lỗi không xác định khi đọc Config.'
    }
  }
}

export interface LoadedRawGrades {
  file: RawGrades
  issues: ValidationIssue[]
}

export async function loadRawGrades(
  config: CourseConfig,
  rawPath: string
): Promise<LoadedRawGrades> {
  // 1. Parse → 2. Validate dữ liệu gốc → 3. Tính điểm danh.
  const file = await parseRawGrades(rawPath, config)
  const validation = validateRawGrades(config, file)
  const applied = applyAttendance(file, config)

  return {
    file: applied.file,
    issues: [...validation, ...applied.issues]
  }
}
