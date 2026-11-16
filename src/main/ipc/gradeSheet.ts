import { ipcMain } from 'electron'
import type { GradeSheetSummaryDto } from '../../shared/ipc'
import type { Course } from '@core/types/course'
import { allQuestions } from '@core/index'
import { errorMessage, hasErrors, toIssueDto } from './common'
import { loadConfig, loadGradeSheet } from './loaders'

export function registerGradeSheetHandlers(): void {
  ipcMain.handle(
    'grade-sheet:parse',
    async (_event, configSource: string | Course, gradeSheetPath: string): Promise<GradeSheetSummaryDto> => {
      const loaded = await loadConfig(configSource)
      if (!loaded.config) {
        return {
          ok: false,
          filePath: gradeSheetPath,
          studentCount: 0,
          sessionCount: 0,
          missingDataCount: 0,
          absentFinalCount: 0,
          issues: loaded.issues.map(toIssueDto),
          hasErrors: true,
          error: loaded.error ?? 'Cấu hình chưa hợp lệ, không thể đọc điểm thô.'
        }
      }

      try {
        const gradeSheet = await loadGradeSheet(loaded.config, gradeSheetPath)
        const ckColumns = new Set(
          allQuestions(loaded.config)
            .filter(({ dot }) => dot.nhom === 'CK')
            .map(({ cauHoi }) => cauHoi.id)
        )
        const missingDataCount = gradeSheet.file.sinhVien.filter((student) =>
          Object.values(student.diem.diemCacCot).some((value) => value === null)
        ).length
        const absentFinalCount = gradeSheet.file.sinhVien.filter((student) =>
          Object.entries(student.diem.diemCacCot).some(
            ([maCot, value]) => ckColumns.has(maCot) && value === 'VT'
          )
        ).length

        return {
          ok: true,
          filePath: gradeSheetPath,
          studentCount: gradeSheet.file.sinhVien.length,
          sessionCount: gradeSheet.file.buoiDiemDanh.length,
          missingDataCount,
          absentFinalCount,
          issues: gradeSheet.issues.map(toIssueDto),
          hasErrors: hasErrors(gradeSheet.issues),
          error: loaded.error
        }
      } catch (error) {
        return {
          ok: false,
          filePath: gradeSheetPath,
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
