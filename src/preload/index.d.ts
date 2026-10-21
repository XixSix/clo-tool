export interface IElectronAPI {
  ping: () => Promise<string>
}

declare global {
  interface Window {
    api: IElectronAPI
  }
}
