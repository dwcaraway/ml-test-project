import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: '../backend/wwwroot',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    proxy: {
      '/test': {
        target: 'https://localhost:7146',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  test: {
    environment: 'happy-dom',
  },
});

