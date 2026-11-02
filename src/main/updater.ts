import { app, type BrowserWindow } from 'electron'
import electronUpdater from 'electron-updater'
import type { UpdateStatusDto } from '../shared/ipc'

// electron-updater là CommonJS — Node ESM không hỗ trợ named import trực tiếp
const { autoUpdater } = electronUpdater

let target: BrowserWindow | null = null
let attached = false

/** Gửi trạng thái cập nhật xuống renderer (bỏ qua nếu cửa sổ đã đóng). */
function send(status: UpdateStatusDto): void {
  if (target && !target.isDestroyed()) {
    target.webContents.send('updater:status', status)
  }
}

/**
 * Gắn sự kiện electron-updater và tự kiểm tra bản mới khi khởi động.
 * Chỉ có tác dụng với bản đã cài (setup.exe) — bản portable không hỗ trợ tự cập nhật.
 */
export function initUpdater(window: BrowserWindow): void {
  target = window
  if (!app.isPackaged || attached) return
  attached = true

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () => send({ state: 'checking' }))
  autoUpdater.on('update-available', (info) =>
    send({ state: 'available', version: info.version })
  )
  autoUpdater.on('update-not-available', () => send({ state: 'latest' }))
  autoUpdater.on('download-progress', (progress) =>
    send({ state: 'downloading', percent: Math.round(progress.percent) })
  )
  autoUpdater.on('update-downloaded', (info) =>
    send({ state: 'downloaded', version: info.version })
  )
  autoUpdater.on('error', (error) => send({ state: 'error', message: error.message }))

  // Không chặn khởi động app nếu máy không có mạng
  void autoUpdater.checkForUpdates().catch(() => undefined)
}

/** Kiểm tra bản mới theo yêu cầu người dùng. */
export function checkForUpdates(): void {
  if (!app.isPackaged) {
    send({ state: 'error', message: 'Bản chạy thử (dev) không kiểm tra cập nhật.' })
    return
  }
  void autoUpdater.checkForUpdates().catch((error: unknown) => {
    send({
      state: 'error',
      message: error instanceof Error ? error.message : 'Không kiểm tra được cập nhật.'
    })
  })
}

/** Khởi động lại và cài bản đã tải xong. */
export function installUpdate(): void {
  if (!app.isPackaged) return
  autoUpdater.quitAndInstall()
}
