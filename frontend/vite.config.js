import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5191,
    strictPort: true,
    allowedHosts: ['.trycloudflare.com'],
    proxy: { '^/api/(?!.*\\.(js|jsx)$)': { target: 'http://127.0.0.1:3949', changeOrigin: true } },
    watch: {
      usePolling: true,
    },
  },
});
