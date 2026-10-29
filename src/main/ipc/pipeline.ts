import { ipcMain } from 'electron'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import {
  calculateAllExamPsychometrics,
  calculateEvaluation,
  writeExamAnalysisReport,
  writeFinalGradesReport
} from '@core/index'
import type { EvaluationResult, RawGrades, ValidationIssue } from '@core/types'
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
      configPath: string,
      rawPath: string,
      outputDir: string,
      sessionId?: string
    ): Promise<RunResultDto> => {
      const empty = emptyResult(outputDir)
      const loaded = await loadConfig(configPath)
      if (!loaded.config || hasErrors(loaded.issues)) {
        return {
          ...empty,
          issues: loaded.issues.map(toIssueDto),
          error: 'File Config còn lỗi. Vui lòng sửa các mục báo đỏ trước khi tính.'
        }
      }

      try {
        const raw = await loadRawGrades(loaded.config, rawPath)
        const rawFile: RawGrades = raw.file
        const issues: ValidationIssue[] = [...loaded.issues, ...raw.issues]
        if (hasErrors(issues)) {
          return {
            ...empty,
            issues: issues.map(toIssueDto),
            error: 'File điểm thô còn lỗi. Vui lòng sửa các mục báo đỏ trước khi tính.'
          }
        }

        const result: EvaluationResult = calculateEvaluation(loaded.config, rawFile.students)
        const exams = calculateAllExamPsychometrics(loaded.config, rawFile.students)
        await mkdir(outputDir, { recursive: true })
        const finalReportPath = join(outputDir, 'final_grades_report.xlsx')
        const examReportPath = join(outputDir, 'exam_analysis_report.xlsx')
        await writeFinalGradesReport(finalReportPath, loaded.config, result, {
          phase: 'both',
          rawFile,
          issues,
          context: {
            hocKy: rawFile.meta.hocKy,
            namHoc: rawFile.meta.namHoc,
            lop: rawFile.meta.lop,
            giangVien: rawFile.meta.giangVien
          }
        })
        await writeExamAnalysisReport(examReportPath, loaded.config, exams, issues)

        // Lưu snapshot chi tiết → màn Sinh viên/Báo cáo xem lại không cần chạy lại
        const candidateRunId = newRunId()
        let savedRunId: string | undefined
        try {
          const snapshot: RunSnapshotDto = {
            runId: candidateRunId,
            sessionId: sessionId ?? '',
            ts: Date.now(),
            config: loaded.config,
            students: result.students,
            summary: result.summary,
            exams
          }
          await saveRunSnapshot(snapshot)
          savedRunId = candidateRunId
        } catch (snapshotError) {
          console.error('Không lưu được snapshot kết quả:', snapshotError)
        }

        const cloStats: CloStatDto[] = loaded.config.cloList.map((clo) => {
          const stat = result.summary.cloStats[clo.maClo]
          return {
            code: clo.maClo,
            passedPercent: stat?.passedPercent ?? 0,
            mean: stat?.mean ?? 0,
            isBelowThreshold: stat?.isBelowThreshold ?? false
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
          studentCount: result.summary.totalStudents,
          passedCount: result.summary.courseStat.passedCount,
          passedPercent: result.summary.courseStat.passedPercent,
          meanCourseScore: result.summary.courseStat.mean,
          absentFinalCount: result.summary.absentStudents,
          missingDataCount: result.summary.missingDataStudents,
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
