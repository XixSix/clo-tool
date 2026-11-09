import { app, dialog, ipcMain, type BrowserWindow } from 'electron'
import { promises as fs } from 'node:fs'
import * as path from 'node:path'
import type { ConfigSummaryDto, StoredCourseConfig } from '../../shared/ipc'
import type { Course } from '@core/types/course'
import { writeRawGradesTemplate } from '@core/io/templateGenerator'
import { hasErrors, toIssueDto } from './common'
import { loadConfig } from './loaders'

function configsDir(): string {
  return path.join(app.getPath('userData'), 'configs')
}

function configFile(sessionId: string): string {
  const safe = String(sessionId).replace(/[^a-zA-Z0-9_-]/g, '')
  return path.join(configsDir(), `${safe}.json`)
}

export function registerConfigHandlers(getWindow?: () => BrowserWindow | null): void {
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

    const course = loaded.config
    return {
      ok: true,
      filePath: configPath,
      courseName: course.tenHp,
      maHp: course.maHp,
      soTinChi: course.soTinChi,
      hinhThucThi: course.hinhThucThi,
      cloList: course.cloList.map((clo) => ({
        code: clo.maClo,
        content: clo.noiDung,
        weight: clo.trongSoClo ?? 1
      })),
      planCount: course.dotDanhGia.length,
      totalWeight: course.dotDanhGia.reduce((sum, dot) => sum + dot.trongSoPhanTram, 0),
      ploCount: course.ploList.length,
      rules: {
        nguongDatClo: course.quyTac.nguongDatClo,
        nguongDatPlo: course.quyTac.nguongDatPlo,
        nguongDatHp: course.quyTac.nguongDatHp,
        hpMethod: course.quyTac.phuongThucTinhHp
      },
      issues: loaded.issues.map(toIssueDto),
      hasErrors: hasErrors(loaded.issues)
    }
  })

  ipcMain.handle(
    'config:get',
    async (_event, sessionId: string): Promise<StoredCourseConfig | null> => {
      try {
        const file = configFile(sessionId)
        const raw = await fs.readFile(file, 'utf8')
        return JSON.parse(raw) as StoredCourseConfig
      } catch {
        return null
      }
    }
  )

  ipcMain.handle(
    'config:save',
    async (_event, sessionId: string, data: StoredCourseConfig): Promise<void> => {
      const file = configFile(sessionId)
      await fs.mkdir(path.dirname(file), { recursive: true })
      await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf8')
    }
  )

  ipcMain.handle(
    'config:export-template',
    async (
      _event,
      course: Course,
      defaultFileName?: string
    ): Promise<{ ok: boolean; path?: string; error?: string }> => {
      try {
        const win = getWindow ? getWindow() : null
        const defaultName = defaultFileName || `Template_DiemTho_${course.maHp || 'mon'}.xlsx`
        const options: Electron.SaveDialogOptions = {
          title: 'Lưu file Template điểm thô',
          defaultPath: defaultName,
          filters: [{ name: 'Excel (.xlsx)', extensions: ['xlsx'] }]
        }
        const result = win
          ? await dialog.showSaveDialog(win, options)
          : await dialog.showSaveDialog(options)

        if (result.canceled || !result.filePath) {
          return { ok: false }
        }

        await writeRawGradesTemplate(result.filePath, course)
        return { ok: true, path: result.filePath }
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : 'Không xuất được file template điểm thô.'
        }
      }
    }
  )
}
