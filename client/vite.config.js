import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@features': path.resolve(__dirname, "./src/features"),
      '@admin': path.resolve(__dirname, './src/app/pages/admin'),
      '@assets': path.resolve(__dirname,'./src/assets'),
      '@utils': path.resolve(__dirname,'./src/utils'),
      '@components': path.resolve(__dirname,'./src/components'),
      '@context': path.resolve(__dirname,'./src/context'),
      '@config': path.resolve(__dirname,'./src/config'),
    }
  }
  ,
  server: {
    proxy: {
      // Proxy API requests to backend server
      '/api': {
        // Use explicit IPv4 loopback to avoid resolving to IPv6 (::1)
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
      },
      // Proxy uploads to backend server
      '/uploads': {
        // Use explicit IPv4 loopback to avoid resolving to IPv6 (::1)
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})