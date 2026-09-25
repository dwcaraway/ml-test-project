import { defineConfig } from 'vitest/config';

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
      '/api': {
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

