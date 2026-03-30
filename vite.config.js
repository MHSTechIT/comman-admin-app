import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/admin-panel-v2': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/admin-panel': {
        target: 'http://localhost:5174',
        changeOrigin: true,
      },
      '/api/gcp-metrics': {
        target: 'https://comman-admin-app-main.vercel.app',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:9000',
        changeOrigin: true,
      },
    },
  },
})
