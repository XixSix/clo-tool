import { ipcMain } from 'electron'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import {
  calculateAllExamPsychometrics,
  calculateEvaluation,
  configSignature,
  hasMultipleFinalExamVariants,
  mergeRawGrades,
  processConfig,
  validateRawGrades,
  writeExamAnalysisReport,
  writeFinalGradesReport,
  writeProcessGradesReport
} from '@core/index'
import type { CourseConfig, EvaluationResult, RawGrades, ValidationIssue } from '@core/types'
import type {
  CloStatDto,
  ExamSummaryDto,
  RunResultDto,
  RunSnapshotDto
} from '../../shared/ipc'
import { errorMessage, hasErrors, toIssueDto } from './common'
import { loadConfig, loadProcessSnapshot, loadRawGrades } from './loaders'
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

function toCloStats(config: CourseConfig, result: EvaluationResult): CloStatDto[] {
  const measured = new Set(config.keHoachDanhGia.map((item) => item.clo))
  return config.cloList
    .filter((clo) => measured.has(clo.maClo))
    .map((clo) => {
      const stat = result.summary.cloStats[clo.maClo]
      return {
        code: clo.maClo,
        passedPercent: stat?.passedPercent ?? 0,
        mean: stat?.mean ?? 0,
        isBelowThreshold: stat?.isBelowThreshold ?? false
      }
    })
}

function toExamSummaries(
  exams: ReturnType<typeof calculateAllExamPsychometrics>
): ExamSummaryDto[] {
  return exams.map((exam) => ({
    maDauDiem: exam.maDauDiem,
    maDe: exam.maDe,
    n: exam.soSinhVien,
    alpha: exam.cronbachAlpha,
    mucDo: exam.mucDoTinCay,
    warning: exam.canhBaoCoMauN
  }))
}

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

        const cloStats = toCloStats(loaded.config, result)
        const examSummaries = toExamSummaries(exams)

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

  ipcMain.handle(
    'pipeline:runProcess',
    async (
      _event,
      configPath: string,
      rawPath: string,
      outputDir: string,
      sessionId?: string
    ): Promise<RunResultDto> => {
      const empty: RunResultDto = { ...emptyResult(outputDir), phase: 'process' }
      const loaded = await loadConfig(configPath)
      if (!loaded.config || hasErrors(loaded.issues)) {
        return {
          ...empty,
          issues: loaded.issues.map(toIssueDto),
          error: 'File Config còn lỗi. Vui lòng sửa các mục báo đỏ trước khi tính.'
        }
      }

      try {
        const raw = await loadRawGrades(loaded.config, rawPath, 'process')
        const issues: ValidationIssue[] = [...loaded.issues, ...raw.issues]
        if (hasErrors(issues)) {
          return {
            ...empty,
            issues: issues.map(toIssueDto),
            error: 'File điểm quá trình còn lỗi. Vui lòng sửa các mục báo đỏ trước khi tính.'
          }
        }

        const phaseCfg = processConfig(loaded.config)
        const result = calculateEvaluation(phaseCfg, raw.file.students)
        await mkdir(outputDir, { recursive: true })
        const processReportPath = join(outputDir, 'final_grades_report_process.xlsx')
        await writeProcessGradesReport(processReportPath, phaseCfg, result, {
          issues,
          context: {
            hocKy: raw.file.meta.hocKy,
            namHoc: raw.file.meta.namHoc,
            lop: raw.file.meta.lop,
            giangVien: raw.file.meta.giangVien
          }
        })

        const candidateRunId = newRunId()
        let savedRunId: string | undefined
        try {
          const snapshot: RunSnapshotDto = {
            runId: candidateRunId,
            sessionId: sessionId ?? '',
            ts: Date.now(),
            phase: 'process',
            config: loaded.config,
            configSignature: configSignature(loaded.config),
            rawGrades: raw.file,
            students: result.students,
            summary: result.summary,
            exams: []
          }
          await saveRunSnapshot(snapshot)
          savedRunId = candidateRunId
        } catch (snapshotError) {
          console.error('Không lưu được snapshot quá trình:', snapshotError)
        }

        return {
          ok: true,
          outputDir,
          phase: 'process',
          runId: savedRunId,
          processReportPath,
          studentCount: result.summary.totalStudents,
          // Điểm học phần/PLO chỉ có nghĩa ở giai đoạn cuối kỳ.
          passedCount: 0,
          passedPercent: 0,
          meanCourseScore: 0,
          absentFinalCount: 0,
          missingDataCount: result.summary.missingDataStudents,
          cloStats: toCloStats(phaseCfg, result),
          exams: [],
          issues: issues.map(toIssueDto)
        }
      } catch (error) {
        return { ...empty, error: errorMessage(error, 'Lỗi không xác định khi tính điểm quá trình.') }
      }
    }
  )

  ipcMain.handle(
    'pipeline:runFinal',
    async (
      _event,
      configPath: string,
      finalRawPath: string,
      outputDir: string,
      processRunId: string,
      sessionId?: string
    ): Promise<RunResultDto> => {
      const empty: RunResultDto = { ...emptyResult(outputDir), phase: 'final' }
      const loaded = await loadConfig(configPath)
      if (!loaded.config || hasErrors(loaded.issues)) {
        return {
          ...empty,
          issues: loaded.issues.map(toIssueDto),
          error: 'File Config còn lỗi. Vui lòng sửa các mục báo đỏ trước khi tính.'
        }
      }

      try {
        const processData = await loadProcessSnapshot(processRunId)
        const processRaw = processData.rawGrades
        if (!processRaw) {
          return {
            ...empty,
            issues: loaded.issues.map(toIssueDto),
            error: processData.error ?? 'Không tìm thấy dữ liệu giai đoạn quá trình.'
          }
        }

        const finalRaw = await loadRawGrades(loaded.config, finalRawPath, 'final')
        const issues: ValidationIssue[] = [...loaded.issues, ...finalRaw.issues]

        if (
          processData.configSignature &&
          processData.configSignature !== configSignature(loaded.config)
        ) {
          issues.push({
            level: 'warning',
            message:
              'Config đã thay đổi so với giai đoạn quá trình; app vẫn tính lại toàn bộ theo Config hiện tại.'
          })
        }

        const merged = mergeRawGrades(processRaw, finalRaw.file, loaded.config)
        issues.push(...merged.issues)
        if (hasErrors(issues)) {
          return {
            ...empty,
            issues: issues.map(toIssueDto),
            error: 'Dữ liệu ghép giữa quá trình và cuối kỳ còn lỗi. Vui lòng kiểm tra các mục báo đỏ.'
          }
        }

        const requireMaDe = hasMultipleFinalExamVariants(loaded.config)
        issues.push(
          ...validateRawGrades(loaded.config, merged.file, { phase: 'final', requireMaDe })
        )
        if (hasErrors(issues)) {
          return {
            ...empty,
            issues: issues.map(toIssueDto),
            error: 'Dữ liệu sau khi ghép còn lỗi. Vui lòng kiểm tra các mục báo đỏ.'
          }
        }

        const result: EvaluationResult = calculateEvaluation(loaded.config, merged.file.students)
        const exams = calculateAllExamPsychometrics(loaded.config, merged.file.students)
        await mkdir(outputDir, { recursive: true })
        const finalReportPath = join(outputDir, 'final_grades_report.xlsx')
        const examReportPath = join(outputDir, 'exam_analysis_report.xlsx')
        await writeFinalGradesReport(finalReportPath, loaded.config, result, {
          phase: 'both',
          rawFile: merged.file,
          issues,
          context: {
            hocKy: merged.file.meta.hocKy,
            namHoc: merged.file.meta.namHoc,
            lop: merged.file.meta.lop,
            giangVien: merged.file.meta.giangVien
          }
        })
        await writeExamAnalysisReport(examReportPath, loaded.config, exams, issues)

        const candidateRunId = newRunId()
        let savedRunId: string | undefined
        try {
          const snapshot: RunSnapshotDto = {
            runId: candidateRunId,
            sessionId: sessionId ?? '',
            ts: Date.now(),
            phase: 'final',
            config: loaded.config,
            configSignature: configSignature(loaded.config),
            students: result.students,
            summary: result.summary,
            exams
          }
          await saveRunSnapshot(snapshot)
          savedRunId = candidateRunId
        } catch (snapshotError) {
          console.error('Không lưu được snapshot cuối kỳ:', snapshotError)
        }

        return {
          ok: true,
          outputDir,
          phase: 'final',
          runId: savedRunId,
          finalReportPath,
          examReportPath,
          studentCount: result.summary.totalStudents,
          passedCount: result.summary.courseStat.passedCount,
          passedPercent: result.summary.courseStat.passedPercent,
          meanCourseScore: result.summary.courseStat.mean,
          absentFinalCount: result.summary.absentStudents,
          missingDataCount: result.summary.missingDataStudents,
          cloStats: toCloStats(loaded.config, result),
          exams: toExamSummaries(exams),
          issues: issues.map(toIssueDto)
        }
      } catch (error) {
        return { ...empty, error: errorMessage(error, 'Lỗi không xác định khi tính điểm cuối kỳ.') }
      }
    }
  )
}
