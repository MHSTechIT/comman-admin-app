import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/admin-panel-v2/',
  server: {
    port: 3000,
    strictPort: true,
    hmr: {
      clientPort: 3000,
    },
  },
})
