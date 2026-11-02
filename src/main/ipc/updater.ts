import { app, ipcMain } from 'electron'
import { checkForUpdates, installUpdate } from '../updater'

export function registerUpdaterHandlers(): void {
  ipcMain.handle('app:version', () => app.getVersion())
  ipcMain.handle('updater:check', () => checkForUpdates())
  ipcMain.handle('updater:install', () => installUpdate())
}
