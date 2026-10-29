import { app, ipcMain } from 'electron'
import { promises as fs } from 'node:fs'
import * as path from 'node:path'
import type { WorkspaceDto } from '../../shared/ipc'

/** File lưu workspace trong userData của app. */
function workspaceFile(): string {
  return path.join(app.getPath('userData'), 'mon-hoc.json')
}

function emptyWorkspace(): WorkspaceDto {
  return { activeId: null, sessions: [] }
}

export function registerWorkspaceHandlers(): void {
  ipcMain.handle('workspace:load', async () => {
    try {
      const raw = await fs.readFile(workspaceFile(), 'utf8')
      const parsed = JSON.parse(raw) as WorkspaceDto
      const sessions = Array.isArray(parsed.sessions) ? parsed.sessions : []
      const activeId = sessions.some((s) => s.id === parsed.activeId) ? parsed.activeId : null
      return { activeId, sessions } satisfies WorkspaceDto
    } catch {
      // Chưa có file (lần đầu chạy) → workspace rỗng
      return emptyWorkspace()
    }
  })

  ipcMain.handle('workspace:save', async (_event, ws: WorkspaceDto) => {
    const file = workspaceFile()
    await fs.mkdir(path.dirname(file), { recursive: true })
    await fs.writeFile(file, JSON.stringify(ws, null, 2), 'utf8')
  })
}
