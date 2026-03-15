import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

const __dirname = new URL('.', import.meta.url).pathname

export default defineConfig({
  plugins: [react()],
  root: __dirname,
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
})
