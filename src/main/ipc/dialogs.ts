import { dialog, ipcMain, type BrowserWindow } from 'electron'

export function registerDialogHandlers(getWindow: () => BrowserWindow | null): void {
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
}
