import { app, dialog, ipcMain, type BrowserWindow } from 'electron'
import { promises as fs } from 'node:fs'
import * as path from 'node:path'
import type { ExportPdfResultDto } from '../../shared/ipc'

/**
 * Xuất báo cáo đang hiển thị ra PDF.
 * Renderer chỉ render vùng `.print-report` khi in (xem index.css), nên
 * `printToPDF` sẽ bỏ toàn bộ sidebar/topbar và UI thao tác.
 */
export function registerExportPdfHandler(getWindow: () => BrowserWindow | null): void {
  ipcMain.handle(
    'export:pdf',
    async (_event, defaultName?: string): Promise<ExportPdfResultDto> => {
      const win = getWindow()
      if (!win) return { ok: false, error: 'Không tìm thấy cửa sổ ứng dụng.' }

      const safeName = String(defaultName ?? 'bao-cao')
        .replace(/[\\/:*?"<>|]+/g, '-')
        .slice(0, 120)
      const picked = await dialog.showSaveDialog(win, {
        title: 'Lưu báo cáo PDF',
        defaultPath: path.join(app.getPath('documents'), `${safeName}.pdf`),
        filters: [{ name: 'PDF', extensions: ['pdf'] }]
      })
      if (picked.canceled || !picked.filePath) return { ok: false, canceled: true }

      try {
        const data = await win.webContents.printToPDF({
          printBackground: true,
          preferCSSPageSize: true,
          landscape: false
        })
        await fs.writeFile(picked.filePath, data)
        return { ok: true, path: picked.filePath }
      } catch (error) {
        return {
          ok: false,
          error: error instanceof Error ? error.message : 'Không xuất được PDF.'
        }
      }
    }
  )
}
