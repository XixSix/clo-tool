import { ipcMain, type BrowserWindow } from 'electron'

export function registerWindowHandlers(getWindow: () => BrowserWindow | null): void {
  ipcMain.handle('window:set-titlebar-theme', (_event, theme: 'light' | 'dark') => {
    const win = getWindow()
    if (!win || win.isDestroyed()) return

    win.setTitleBarOverlay({
      color: theme === 'dark' ? '#0f0f0f' : '#ffffff',
      symbolColor: theme === 'dark' ? '#a3a3a3' : '#525252',
      height: 36
    })
  })
}
