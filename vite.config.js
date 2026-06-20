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
