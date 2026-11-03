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

export async function loadConfig(
  configSource: string | CourseConfig
): Promise<LoadedConfig> {
  if (typeof configSource !== 'string') {
    return { config: configSource, issues: validateConfig(configSource) }
  }
  try {
    const config = await parseCourseConfig(configSource)
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
  const file = await parseRawGrades(rawPath, config)
  const applied = applyAttendance(file, config)
  const validation = validateRawGrades(config, applied.file)

  return {
    file: applied.file,
    issues: [...validation, ...applied.issues]
  }
}
