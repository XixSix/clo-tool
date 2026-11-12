import { ipcMain } from 'electron'
import type { GradePhase } from '@core/types'
import type { RawSummaryDto } from '../../shared/ipc'
import { errorMessage, hasErrors, toIssueDto } from './common'
import { loadConfig, loadRawGrades } from './loaders'

export function registerRawGradesHandlers(): void {
  ipcMain.handle(
    'raw:parse',
    async (
      _event,
      configPath: string,
      rawPath: string,
      phase?: GradePhase
    ): Promise<RawSummaryDto> => {
      const loaded = await loadConfig(configPath)
      if (!loaded.config) {
        return {
          ok: false,
          filePath: rawPath,
          phase,
          studentCount: 0,
          sessionCount: 0,
          missingDataCount: 0,
          absentFinalCount: 0,
          issues: loaded.issues.map(toIssueDto),
          hasErrors: true,
          error: 'Config chưa hợp lệ, không thể đọc điểm thô.'
        }
      }

      try {
        const raw = await loadRawGrades(loaded.config, rawPath, phase)
        const ckCodes = new Set(
          loaded.config.keHoachDanhGia
            .filter((plan) => plan.nhom === 'CK')
            .map((plan) => plan.maDauDiem)
        )
        const missingDataCount = raw.file.students.filter((student) =>
          Object.values(student.scores.diemCacCot).some((value) => value === null)
        ).length
        const absentFinalCount =
          phase === 'process'
            ? 0
            : raw.file.students.filter((student) =>
                Object.entries(student.scores.diemCacCot).some(
                  ([code, value]) => ckCodes.has(code) && value === 'VT'
                )
              ).length

        return {
          ok: true,
          filePath: rawPath,
          phase,
          studentCount: raw.file.students.length,
          sessionCount: raw.file.attendanceSessions.length,
          missingDataCount,
          absentFinalCount,
          issues: raw.issues.map(toIssueDto),
          hasErrors: hasErrors(raw.issues)
        }
      } catch (error) {
        return {
          ok: false,
          filePath: rawPath,
          phase,
          studentCount: 0,
          sessionCount: 0,
          missingDataCount: 0,
          absentFinalCount: 0,
          issues: [],
          hasErrors: true,
          error: errorMessage(error, 'Lỗi không xác định khi đọc điểm thô.')
        }
      }
    }
  )
}
