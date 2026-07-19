import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In dev, proxy /api/dc → the DataCommon API (which has no CORS headers).
// In production the same path is served by the Vercel function in api/dc.js.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/dc': {
        target: 'https://datacommon.mapc.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/dc/, '/api/'),
      },
    },
  },
})
