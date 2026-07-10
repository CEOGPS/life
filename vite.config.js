import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path from 'path';

const isElectron = process.env.ELECTRON === "true";

export default defineConfig({
  logLevel: 'error',
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    allowedHosts: true,
    hmr: { clientPort: 443 },
    watch: {
      followSymlinks: false,
      ignored: ['**/frontend/**', '**/node_modules/**', '**/.git/**', '**/dist/**'],
    },
  },
  // Use relative paths when building for Electron (file:// protocol)
  base: isElectron ? "./" : "/",
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main:  path.resolve(__dirname, 'index.html'),
        music: path.resolve(__dirname, 'music.html'),
      },
    },
  },
});
