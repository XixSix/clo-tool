import { contextBridge, ipcRenderer } from 'electron'

// Cầu nối bảo mật an toàn giữa Main Process và Renderer
const api = {
  ping: () => ipcRenderer.invoke('ping')
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
