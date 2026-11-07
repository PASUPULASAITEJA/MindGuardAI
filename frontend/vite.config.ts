import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true, // Listens on all local IP interfaces (required for container mapping)
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err: any) => {
            if (err?.code === 'ECONNREFUSED' || err?.code === 'ECONNRESET' || err?.code === 'ECONNABORTED') {
              // Gracefully handle backend offline or client disconnect without noisy stack traces
              return;
            }
            console.warn('[vite proxy error /api]:', err?.message || err);
          });
        },
      },
      '/ws': {
        target: 'ws://127.0.0.1:8000',
        ws: true,
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err: any) => {
            if (err?.code === 'ECONNREFUSED' || err?.code === 'ECONNRESET' || err?.code === 'ECONNABORTED') {
              // Gracefully handle backend WebSocket offline or tab close
              return;
            }
            console.warn('[vite proxy error /ws]:', err?.message || err);
          });
        },
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('three') || id.includes('@react-three')) return 'vendor-three';
            if (id.includes('recharts')) return 'vendor-recharts';
            if (id.includes('framer-motion') || id.includes('motion')) return 'vendor-motion';
            if (id.includes('lottie-web') || id.includes('lottie-react')) return 'vendor-lottie';
            return 'vendor';
          }
        },
      },
    },
  },
})
