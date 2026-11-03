import { contextBridge, ipcRenderer } from 'electron'
import type { CloApi, UpdateStatusDto } from '../shared/ipc'

// Cầu nối bảo mật an toàn giữa Main Process và Renderer
const api: CloApi = {
  pickFile: (kind) => ipcRenderer.invoke('dialog:pick-file', kind),
  pickDirectory: () => ipcRenderer.invoke('dialog:pick-directory'),
  parseConfig: (configPath) => ipcRenderer.invoke('config:parse', configPath),
  getCourseConfig: (sessionId) => ipcRenderer.invoke('config:get', sessionId),
  saveCourseConfig: (sessionId, data) => ipcRenderer.invoke('config:save', sessionId, data),
  exportRawGradesTemplate: (config, defaultFileName) =>
    ipcRenderer.invoke('config:export-template', config, defaultFileName),
  parseRawGrades: (configSource, rawPath) =>
    ipcRenderer.invoke('raw:parse', configSource, rawPath),
  runPipeline: (configSource, rawPath, outputDir, sessionId) =>
    ipcRenderer.invoke('pipeline:run', configSource, rawPath, outputDir, sessionId),
  getRunSnapshot: (runId) => ipcRenderer.invoke('runs:get', runId),
  deleteRunSnapshot: (runId) => ipcRenderer.invoke('runs:delete', runId),
  exportPdf: (defaultName) => ipcRenderer.invoke('export:pdf', defaultName),
  createSamples: (outputDir) => ipcRenderer.invoke('samples:create', outputDir),
  openPath: (path) => ipcRenderer.invoke('shell:open-path', path),
  loadWorkspace: () => ipcRenderer.invoke('workspace:load'),
  saveWorkspace: (ws) => ipcRenderer.invoke('workspace:save', ws),
  getAppVersion: () => ipcRenderer.invoke('app:version'),
  checkForUpdates: () => ipcRenderer.invoke('updater:check'),
  installUpdate: () => ipcRenderer.invoke('updater:install'),
  onUpdateStatus: (listener) => {
    const handler = (_event: unknown, status: UpdateStatusDto): void => listener(status)
    ipcRenderer.on('updater:status', handler)
    return () => {
      ipcRenderer.removeListener('updater:status', handler)
    }
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error('Failed to expose api in contextBridge:', error)
  }
} else {
  // @ts-expect-error fallback when context isolation is disabled
  window.api = api
}
