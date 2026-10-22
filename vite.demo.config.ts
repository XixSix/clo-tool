import { resolve } from 'node:path'
import { defineConfig } from 'vite'

/** Cấu hình riêng cho `npm run demo` (vite-node) – chỉ cần alias @core */
export default defineConfig({
  resolve: {
    alias: {
      '@core': resolve(__dirname, 'src/core')
    }
  }
})
