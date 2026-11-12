import {
  applyAttendance,
  hasMultipleFinalExamVariants,
  parseCourseConfig,
  parseRawGrades,
  phaseConfig,
  validateConfig,
  validateRawGrades
} from '@core/index'
import type { CourseConfig, GradePhase, RawGrades, ValidationIssue } from '@core/types'
import { readRunSnapshot } from './runs'

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
  rawPath: string,
  phase?: GradePhase
): Promise<LoadedRawGrades> {
  // 1. Parse → 2. Validate dữ liệu gốc → 3. Tính điểm danh (trừ giai đoạn cuối kỳ).
  const effectiveConfig = phase ? phaseConfig(config, phase) : config
  const requireMaDe = phase === 'final' && hasMultipleFinalExamVariants(config)
  const file = await parseRawGrades(rawPath, config, { phase, requireMaDe })
  const validation = validateRawGrades(effectiveConfig, file, { phase, requireMaDe })
  if (phase === 'final') {
    return { file, issues: validation }
  }
  const applied = applyAttendance(file, config)

  return {
    file: applied.file,
    issues: [...validation, ...applied.issues]
  }
}

/** Snapshot quá trình hợp lệ để chạy tiếp giai đoạn cuối kỳ. */
export async function loadProcessSnapshot(
  runId: string
): Promise<{ rawGrades?: RawGrades; configSignature?: string; error?: string }> {
  const snapshot = await readRunSnapshot(runId)
  if (!snapshot || snapshot.phase !== 'process' || !snapshot.rawGrades) {
    return {
      error:
        'Không tìm thấy dữ liệu giai đoạn quá trình. Vui lòng chạy lại giai đoạn quá trình trước.'
    }
  }
  return { rawGrades: snapshot.rawGrades, configSignature: snapshot.configSignature }
}
