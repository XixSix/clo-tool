/** Đăng ký toàn bộ IPC handler của main process. */

import type { BrowserWindow } from 'electron'
import { registerDialogHandlers } from './ipc/dialogs'
import { registerConfigHandlers } from './ipc/config'
import { registerRawGradesHandlers } from './ipc/rawGrades'
import { registerPipelineHandlers } from './ipc/pipeline'
import { registerRunHandlers } from './ipc/runs'
import { registerExportPdfHandler } from './ipc/exportPdf'
import { registerSampleHandlers } from './ipc/samples'
import { registerShellHandlers } from './ipc/shell'
import { registerWorkspaceHandlers } from './ipc/workspace'
import { registerUpdaterHandlers } from './ipc/updater'

// This is a comment
export function registerIpcHandlers(getWindow: () => BrowserWindow | null): void {
  registerDialogHandlers(getWindow)
  registerConfigHandlers()
  registerRawGradesHandlers()
  registerPipelineHandlers()
  registerRunHandlers()
  registerSampleHandlers()
  registerShellHandlers()
  registerWorkspaceHandlers()
  registerExportPdfHandler(getWindow)
  registerUpdaterHandlers()
}
