// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    // Proxy /api requests to the backend to avoid CORS during dev
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
        // keep the /api prefix — backend expects /api/keys etc.
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
      // If your frontend requests any /.well-known paths, proxy those too:
      '/.well-known': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
      }
    }
  }
})
