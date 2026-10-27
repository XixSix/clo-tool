import { ipcMain, shell } from 'electron'

export function registerShellHandlers(): void {
  ipcMain.handle('shell:open-path', async (_event, path: string) => {
    await shell.openPath(path)
  })
}
