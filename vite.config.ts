import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Ensures relative paths for assets so they work in the Golang embed
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});