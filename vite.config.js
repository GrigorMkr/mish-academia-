import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: false,
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: 'index.html',
    },
    assetsDir: 'assets',
  },
  server: {
    open: true,
  },
});
