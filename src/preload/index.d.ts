import type { CloApi } from '../shared/ipc'

declare global {
  interface Window {
    api: CloApi
  }
}

export {}
