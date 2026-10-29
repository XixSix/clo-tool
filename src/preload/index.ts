import { contextBridge, ipcRenderer } from 'electron'
import type { CloApi } from '../shared/ipc'

// Cầu nối bảo mật an toàn giữa Main Process và Renderer
const api: CloApi = {
  pickFile: (kind) => ipcRenderer.invoke('dialog:pick-file', kind),
  pickDirectory: () => ipcRenderer.invoke('dialog:pick-directory'),
  parseConfig: (configPath) => ipcRenderer.invoke('config:parse', configPath),
  parseRawGrades: (configPath, rawPath) => ipcRenderer.invoke('raw:parse', configPath, rawPath),
  runPipeline: (configPath, rawPath, outputDir, sessionId) =>
    ipcRenderer.invoke('pipeline:run', configPath, rawPath, outputDir, sessionId),
  getRunSnapshot: (runId) => ipcRenderer.invoke('runs:get', runId),
  deleteRunSnapshot: (runId) => ipcRenderer.invoke('runs:delete', runId),
  exportPdf: (defaultName) => ipcRenderer.invoke('export:pdf', defaultName),
  createSamples: (outputDir) => ipcRenderer.invoke('samples:create', outputDir),
  openPath: (path) => ipcRenderer.invoke('shell:open-path', path),
  loadWorkspace: () => ipcRenderer.invoke('workspace:load'),
  saveWorkspace: (ws) => ipcRenderer.invoke('workspace:save', ws)
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
