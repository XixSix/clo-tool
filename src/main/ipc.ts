/**
 * IPC handlers: cầu nối giữa giao diện và core engine.
 * Toàn bộ việc đọc/ghi file thật diễn ra ở main process (offline, không gọi mạng).
 */

import { dialog, ipcMain, shell, type BrowserWindow } from 'electron'
import { copyFile, mkdir, access } from 'node:fs/promises'
import { constants } from 'node:fs'
import { join } from 'node:path'
import {
  applyAttendance,
  calculateAllExamPsychometrics,
  calculateEvaluation,
  parseCourseConfig,
  parseRawGrades,
  validateConfig,
  validateRawGrades,
  writeExamAnalysisReport,
  writeFinalGradesReport
} from '@core/index'
import type { CourseConfig, EvaluationResult, RawGradesFile, ValidationIssue } from '@core/types'
import type {
  CloStatDto,
  ConfigSummaryDto,
  ExamSummaryDto,
  IssueDto,
  RawSummaryDto,
  RunResultDto,
  SampleResultDto
} from '../shared/ipc'

function toIssueDto(issue: ValidationIssue): IssueDto {
  return {
    level: issue.level,
    sheet: issue.sheet,
    row: issue.row,
    column: issue.column,
    message: issue.message,
    suggestion: issue.suggestion
  }
}

function hasErrors(issues: ValidationIssue[]): boolean {
  return issues.some((i) => i.level === 'error')
}

interface LoadedConfig {
  config?: CourseConfig
  issues: ValidationIssue[]
  error?: string
}

async function loadConfig(configPath: string): Promise<LoadedConfig> {
  try {
    const parsed = await parseCourseConfig(configPath)
    if (!parsed.config) return { issues: parsed.issues, error: 'Không đọc được file Config.' }
    const issues = [...parsed.issues, ...validateConfig(parsed.config)]
    return { config: parsed.config, issues }
  } catch (error) {
    return {
      issues: [],
      error: error instanceof Error ? error.message : 'Lỗi không xác định khi đọc Config.'
    }
  }
}

export function registerIpcHandlers(getWindow: () => BrowserWindow | null): void {
  ipcMain.handle('dialog:pick-file', async (_event, kind: 'config' | 'raw') => {
    const win = getWindow()
    const options: Electron.OpenDialogOptions = {
      title: kind === 'config' ? 'Chọn file Config học phần' : 'Chọn file điểm thô',
      properties: ['openFile'],
      filters: [
        { name: 'Excel (.xlsx)', extensions: ['xlsx'] },
        { name: 'Tất cả file', extensions: ['*'] }
      ]
    }
    const result = win
      ? await dialog.showOpenDialog(win, options)
      : await dialog.showOpenDialog(options)
    return result.canceled || result.filePaths.length === 0 ? null : result.filePaths[0]
  })

  ipcMain.handle('dialog:pick-directory', async () => {
    const win = getWindow()
    const options: Electron.OpenDialogOptions = {
      title: 'Chọn thư mục lưu báo cáo',
      properties: ['openDirectory', 'createDirectory']
    }
    const result = win
      ? await dialog.showOpenDialog(win, options)
      : await dialog.showOpenDialog(options)
    return result.canceled || result.filePaths.length === 0 ? null : result.filePaths[0]
  })

  ipcMain.handle('config:parse', async (_event, configPath: string): Promise<ConfigSummaryDto> => {
    const loaded = await loadConfig(configPath)
    if (!loaded.config) {
      return {
        ok: false,
        filePath: configPath,
        cloList: [],
        planCount: 0,
        totalWeight: 0,
        ploCount: 0,
        issues: loaded.issues.map(toIssueDto),
        hasErrors: true,
        error: loaded.error
      }
    }

    const config = loaded.config
    return {
      ok: true,
      filePath: configPath,
      courseName: config.courseInfo.tenHp,
      maHp: config.courseInfo.maHp,
      soTinChi: config.courseInfo.soTinChi,
      hinhThucThi: config.courseInfo.hinhThucThi,
      cloList: config.cloList.map((c) => ({
        code: c.maClo,
        content: c.noiDung,
        weight: c.trongSoClo ?? 1
      })),
      planCount: config.keHoachDanhGia.length,
      totalWeight: config.keHoachDanhGia.reduce((sum, p) => sum + p.trongSoPhanTram, 0),
      ploCount: new Set(config.maTranPlo.map((m) => m.plo)).size,
      rules: {
        nguongDatClo: config.quyTac.nguong_dat_clo,
        nguongDatPlo: config.quyTac.nguong_dat_plo,
        nguongDatHp: config.quyTac.nguong_dat_hp,
        hpMethod: config.quyTac.hp_method
      },
      issues: loaded.issues.map(toIssueDto),
      hasErrors: hasErrors(loaded.issues)
    }
  })

  ipcMain.handle(
    'raw:parse',
    async (_event, configPath: string, rawPath: string): Promise<RawSummaryDto> => {
      const loaded = await loadConfig(configPath)
      if (!loaded.config) {
        return {
          ok: false,
          filePath: rawPath,
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
        const parsed = await parseRawGrades(rawPath, loaded.config)
        if (!parsed.file) {
          return {
            ok: false,
            filePath: rawPath,
            studentCount: 0,
            sessionCount: 0,
            missingDataCount: 0,
            absentFinalCount: 0,
            issues: parsed.issues.map(toIssueDto),
            hasErrors: true,
            error: 'Không đọc được dữ liệu điểm thô.'
          }
        }

        const applied = applyAttendance(parsed.file, loaded.config)
        const validation = validateRawGrades(loaded.config, applied.file)
        const issues = [...parsed.issues, ...validation, ...applied.issues]
        const ckCodes = new Set(
          loaded.config.keHoachDanhGia.filter((p) => p.nhom === 'CK').map((p) => p.maDauDiem)
        )

        const missingDataCount = applied.file.students.filter((st) =>
          Object.values(st.diemCacCot).some((value) => value === null)
        ).length
        const absentFinalCount = applied.file.students.filter((st) =>
          Object.entries(st.diemCacCot).some(([code, value]) => ckCodes.has(code) && value === 'VT')
        ).length

        return {
          ok: true,
          filePath: rawPath,
          studentCount: applied.file.students.length,
          sessionCount: applied.file.attendanceSessions.length,
          missingDataCount,
          absentFinalCount,
          issues: issues.map(toIssueDto),
          hasErrors: hasErrors(issues)
        }
      } catch (error) {
        return {
          ok: false,
          filePath: rawPath,
          studentCount: 0,
          sessionCount: 0,
          missingDataCount: 0,
          absentFinalCount: 0,
          issues: [],
          hasErrors: true,
          error: error instanceof Error ? error.message : 'Lỗi không xác định khi đọc điểm thô.'
        }
      }
    }
  )

  ipcMain.handle(
    'pipeline:run',
    async (
      _event,
      configPath: string,
      rawPath: string,
      outputDir: string
    ): Promise<RunResultDto> => {
      const empty: RunResultDto = {
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
      }

      const loaded = await loadConfig(configPath)
      if (!loaded.config || hasErrors(loaded.issues)) {
        return {
          ...empty,
          issues: loaded.issues.map(toIssueDto),
          error: 'File Config còn lỗi. Vui lòng sửa các mục báo đỏ trước khi tính.'
        }
      }

      try {
        const parsedRaw = await parseRawGrades(rawPath, loaded.config)
        if (!parsedRaw.file) {
          return {
            ...empty,
            issues: parsedRaw.issues.map(toIssueDto),
            error: 'Không đọc được file điểm thô.'
          }
        }

        const applied = applyAttendance(parsedRaw.file, loaded.config)
        const rawFile: RawGradesFile = applied.file
        const validation = validateRawGrades(loaded.config, rawFile)
        const issues: ValidationIssue[] = [
          ...loaded.issues,
          ...parsedRaw.issues,
          ...validation,
          ...applied.issues
        ]

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
        return {
          ...empty,
          error: error instanceof Error ? error.message : 'Lỗi không xác định khi tính toán.'
        }
      }
    }
  )

  ipcMain.handle('samples:create', async (_event, outputDir: string): Promise<SampleResultDto> => {
    try {
      // __dirname = <app>/out/main khi chạy dev/build; = app.asar/out/main khi đóng gói
      const templateDir = join(__dirname, '..', '..', 'resources', 'templates')
      const configSource = join(templateDir, 'Template_Config.xlsx')
      const rawSource = join(templateDir, 'Template_DiemTho.xlsx')
      await access(configSource, constants.R_OK)
      await access(rawSource, constants.R_OK)

      await mkdir(outputDir, { recursive: true })
      const configPath = join(outputDir, 'Template_Config.xlsx')
      const rawPath = join(outputDir, 'Template_DiemTho.xlsx')
      await copyFile(configSource, configPath)
      await copyFile(rawSource, rawPath)

      return { ok: true, dir: outputDir, configPath, rawPath }
    } catch (error) {
      return {
        ok: false,
        dir: outputDir,
        error:
          'Không tìm thấy file mẫu trong resources/templates. ' +
          (error instanceof Error ? error.message : '')
      }
    }
  })

  ipcMain.handle('shell:open-path', async (_event, path: string) => {
    await shell.openPath(path)
  })
}
