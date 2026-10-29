import { app, ipcMain } from 'electron'
import { promises as fs } from 'node:fs'
import * as path from 'node:path'
import type { RunSnapshotDto } from '../../shared/ipc'

/**
 * Snapshot kết quả từng lần chạy: lưu riêng 1 file JSON trong userData/runs
 * để `mon-hoc.json` không phình to. Renderer tải theo nhu cầu.
 */
function runsDir(): string {
  return path.join(app.getPath('userData'), 'runs')
}

/** Chỉ cho phép ký tự an toàn — tránh path traversal từ runId */
function snapshotFile(runId: string): string {
  const safe = String(runId).replace(/[^a-zA-Z0-9_-]/g, '')
  return path.join(runsDir(), `${safe}.json`)
}

export async function saveRunSnapshot(snapshot: RunSnapshotDto): Promise<string> {
  const file = snapshotFile(snapshot.runId)
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, JSON.stringify(snapshot), 'utf8')
  return file
}

export function registerRunHandlers(): void {
  ipcMain.handle('runs:get', async (_event, runId: string): Promise<RunSnapshotDto | null> => {
    try {
      const raw = await fs.readFile(snapshotFile(runId), 'utf8')
      return JSON.parse(raw) as RunSnapshotDto
    } catch {
      // Chưa có file (dữ liệu cũ) hoặc file hỏng → coi như không có chi tiết
      return null
    }
  })

  ipcMain.handle('runs:delete', async (_event, runId: string): Promise<void> => {
    try {
      await fs.unlink(snapshotFile(runId))
    } catch {
      // Không tồn tại → bỏ qua
    }
  })
}
