import { ipcMain } from 'electron'
import type { GradeSheetSummaryDto } from '../../shared/ipc'
import type { Course } from '@core/types/course'
import { allQuestions } from '@core/index'
import { errorMessage, hasErrors, toIssueDto } from './common'
import { loadGradeSheet } from './loaders'

export function registerGradeSheetHandlers(): void {
  ipcMain.handle(
    'grade-sheet:parse',
    async (_event, course: Course, gradeSheetPath: string): Promise<GradeSheetSummaryDto> => {
      try {
        const gradeSheet = await loadGradeSheet(course, gradeSheetPath)
        const ckColumns = new Set(
          allQuestions(course)
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
          hasErrors: hasErrors(gradeSheet.issues)
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
