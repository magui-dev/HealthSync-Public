import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Fixed: object 형태로, 괄호/중괄호 모두 닫힘
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    strictPort: true,
    // 필요시 프록시:
    // proxy: {
    //   '/api': { target: 'http://localhost:8080', changeOrigin: true },
    //   '/logintest': { target: 'http://localhost:8080', changeOrigin: true },
    // },
  },
})