import { app, dialog, ipcMain, type BrowserWindow } from 'electron'
import { promises as fs } from 'node:fs'
import * as path from 'node:path'
import type { StoredCourseConfig } from '../../shared/ipc'
import type { Course } from '@core/types/course'
import { writeGradeSheetTemplate } from '@core/io/templateGenerator'

function configsDir(): string {
  return path.join(app.getPath('userData'), 'configs')
}

function configFile(sessionId: string): string {
  const safe = String(sessionId).replace(/[^a-zA-Z0-9_-]/g, '')
  return path.join(configsDir(), `${safe}.json`)
}

export function registerConfigHandlers(getWindow?: () => BrowserWindow | null): void {
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

        await writeGradeSheetTemplate(result.filePath, course)
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
