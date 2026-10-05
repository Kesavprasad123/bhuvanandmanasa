import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

// Serve the ORIGINAL repo assets at /assets during dev, and copy them into dist on build.
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'serve-shared-assets',
      configureServer(server) {
        server.middlewares.use('/assets', (req, res, next) => {
          const file = path.resolve(__dirname, '..', 'assets', decodeURIComponent((req.url || '').split('?')[0]));
          if (!file.startsWith(path.resolve(__dirname, '..', 'assets'))) return next();
          fs.readFile(file, (err, data) => {
            if (err) return res.statusCode = 404, res.end('not found');
            const ext = path.extname(file).toLowerCase();
            const types = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.svg': 'image/svg+xml' };
            res.setHeader('Content-Type', types[ext] || 'application/octet-stream');
            res.end(data);
          });
        });
      },
      closeBundle() {
        fs.cpSync(path.resolve(__dirname, '..', 'assets'), path.resolve(__dirname, 'dist', 'assets'), { recursive: true });
      }
    }
  ]
});
