import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  root: projectRoot,
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/.test(id)) return 'react';
          if (/[\\/]node_modules[\\/](framer-motion|gsap|aos|swiper)[\\/]/.test(id)) return 'animation';
          if (/[\\/]node_modules[\\/](recharts)[\\/]/.test(id)) return 'charts';
          if (/[\\/]node_modules[\\/](axios|lucide-react|react-hot-toast)[\\/]/.test(id)) return 'vendor';
          return 'vendor';
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
      '/uploads': { target: 'http://localhost:5000', changeOrigin: true },
    },
    watch: {
      usePolling: true,
      interval: 300,
    },
    hmr: {
      overlay: true, 
    },
  },
})