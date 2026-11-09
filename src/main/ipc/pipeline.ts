import { ipcMain } from 'electron'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import {
  buildStudentRecords,
  calculateAllExamPsychometrics,
  calculateEvaluation,
  writeExamAnalysisReport,
  writeFinalGradesReport
} from '@core/index'
import type { Course, RawGrades, ValidationIssue } from '@core/types'
import type { CloStatDto, ExamSummaryDto, RunResultDto, RunSnapshotDto } from '../../shared/ipc'
import { errorMessage, hasErrors, toIssueDto } from './common'
import { loadConfig, loadRawGrades } from './loaders'
import { saveRunSnapshot } from './runs'

function newRunId(): string {
  return `run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

const emptyResult = (outputDir: string): RunResultDto => ({
  ok: false,
  outputDir,
  studentCount: 0,
  passedCount: 0,
  passedPercent: 0,
  meanCourseScore: 0,
  absentFinalCount: 0,
  missingDataCount: 0,
  cloStats: [],
  exams: [],
  issues: []
})

export function registerPipelineHandlers(): void {
  ipcMain.handle(
    'pipeline:run',
    async (
      _event,
      configSource: string | Course,
      rawPath: string,
      outputDir: string,
      sessionId?: string
    ): Promise<RunResultDto> => {
      const empty = emptyResult(outputDir)
      const loaded = await loadConfig(configSource)
      if (!loaded.config || hasErrors(loaded.issues)) {
        return {
          ...empty,
          issues: loaded.issues.map(toIssueDto),
          error:
            loaded.error ?? 'Cấu hình môn học còn lỗi. Vui lòng sửa các mục báo đỏ trước khi tính.'
        }
      }

      try {
        const course = loaded.config
        const raw = await loadRawGrades(course, rawPath)
        const rawFile: RawGrades = raw.file
        const issues: ValidationIssue[] = [...loaded.issues, ...raw.issues]
        if (hasErrors(issues)) {
          return {
            ...empty,
            issues: issues.map(toIssueDto),
            error: 'File điểm thô còn lỗi. Vui lòng sửa các mục báo đỏ trước khi tính.'
          }
        }

        const { students, records } = buildStudentRecords(course, rawFile)
        const result = calculateEvaluation(course, students, records)
        const exams = calculateAllExamPsychometrics(course, students, records)
        await mkdir(outputDir, { recursive: true })
        const finalReportPath = join(outputDir, 'final_grades_report.xlsx')
        const examReportPath = join(outputDir, 'exam_analysis_report.xlsx')
        await writeFinalGradesReport(finalReportPath, course, result, {
          phase: 'both',
          rawFile,
          issues,
          students,
          context: {
            hocKy: rawFile.meta.hocKy,
            namHoc: rawFile.meta.namHoc,
            lop: rawFile.meta.lop,
            giangVien: rawFile.meta.giangVien
          }
        })
        await writeExamAnalysisReport(examReportPath, course, exams, issues)

        // Lưu snapshot chi tiết → màn Sinh viên/Báo cáo xem lại không cần chạy lại
        const candidateRunId = newRunId()
        let savedRunId: string | undefined
        try {
          const snapshot: RunSnapshotDto = {
            runId: candidateRunId,
            sessionId: sessionId ?? '',
            ts: Date.now(),
            config: course,
            students,
            results: result.sinhVien,
            summary: result.tongHop,
            exams
          }
          await saveRunSnapshot(snapshot)
          savedRunId = candidateRunId
        } catch (snapshotError) {
          console.error('Không lưu được snapshot kết quả:', snapshotError)
        }

        const cloStats: CloStatDto[] = course.cloList.map((clo) => {
          const stat = result.tongHop.clo.find((s) => s.cloId === clo.id)
          return {
            code: clo.maClo,
            passedPercent: stat?.tyLeDat ?? 0,
            mean: stat?.trungBinh ?? 0,
            isBelowThreshold: stat?.duoiNguongCanhBao ?? false
          }
        })
        const examSummaries: ExamSummaryDto[] = exams.map((exam) => ({
          maDauDiem: exam.maDauDiem,
          maDe: exam.maDe,
          n: exam.soSinhVien,
          alpha: exam.cronbachAlpha,
          mucDo: exam.mucDoTinCay,
          warning: exam.canhBaoCoMauN
        }))

        return {
          ok: true,
          outputDir,
          runId: savedRunId,
          finalReportPath,
          examReportPath,
          studentCount: result.tongHop.tongSinhVien,
          passedCount: result.tongHop.hocPhan.soSinhVienDat,
          passedPercent: result.tongHop.hocPhan.tyLeDat,
          meanCourseScore: result.tongHop.hocPhan.trungBinh,
          absentFinalCount: result.tongHop.soSinhVienVangThi,
          missingDataCount: result.tongHop.soSinhVienThieuDuLieu,
          cloStats,
          exams: examSummaries,
          issues: issues.map(toIssueDto)
        }
      } catch (error) {
        return { ...empty, error: errorMessage(error, 'Lỗi không xác định khi tính toán.') }
      }
    }
  )
}
