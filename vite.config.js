import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/azure-api': {
        target: 'https://management.azure.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/azure-api/, ''),
      },
      '/azure-token': {
        target: 'https://login.microsoftonline.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/azure-token/, ''),
      }
    }
  }
})