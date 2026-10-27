/** Đăng ký toàn bộ IPC handler của main process. */

import type { BrowserWindow } from 'electron'
import { registerDialogHandlers } from './ipc/dialogs'
import { registerConfigHandlers } from './ipc/config'
import { registerRawGradesHandlers } from './ipc/rawGrades'
import { registerPipelineHandlers } from './ipc/pipeline'
import { registerSampleHandlers } from './ipc/samples'
import { registerShellHandlers } from './ipc/shell'

export function registerIpcHandlers(getWindow: () => BrowserWindow | null): void {
  registerDialogHandlers(getWindow)
  registerConfigHandlers()
  registerRawGradesHandlers()
  registerPipelineHandlers()
  registerSampleHandlers()
  registerShellHandlers()
}
