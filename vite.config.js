import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-404-and-routes',
      closeBundle() {
        const dist = resolve(__dirname, 'dist');
        const indexHtml = resolve(dist, 'index.html');
        const notFoundHtml = resolve(dist, '404.html');
        if (fs.existsSync(indexHtml)) {
          fs.copyFileSync(indexHtml, notFoundHtml);
        }
      },
    },
  ],
  base: '/',
  build: {
    outDir: 'dist',
    target: 'es2020',
    cssCodeSplit: true,
    minify: 'esbuild',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        accommodation: resolve(__dirname, 'accommodation/index.html'),
      },
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
        },
      },
    },
  },
});
