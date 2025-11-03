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
})