import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = dirname(fileURLToPath(import.meta.url));

/**
 * Client-side routes that must also resolve as a real directory on static
 * hosting (GitHub Pages), so guests can open or refresh e.g. /accommodation
 * directly. Each route gets a copy of the built index.html (same hashed
 * bundle — no duplicated CSS/JS) plus a noindex tag so guest details stay
 * out of search engines.
 */
const SPA_ROUTES = ['accommodation'];

const ROUTE_META = [
  [/<title>[^<]*<\/title>/, '<title>Wedding Accommodation | Bhuvan &amp; Manasa</title>'],
  [/<link rel="canonical" href="[^"]*">/, '<link rel="canonical" href="https://bhuvanmanasa.in/accommodation">'],
  [
    /<meta property="og:url" content="[^"]*">/,
    '<meta property="og:url" content="https://bhuvanmanasa.in/accommodation">',
  ],
  [
    /<meta property="og:title" content="[^"]*">/,
    '<meta property="og:title" content="Wedding Accommodation | Bhuvan &amp; Manasa">',
  ],
  [
    /<meta property="og:description" content="[^"]*">/,
    '<meta property="og:description" content="Room and guest accommodation details for the Bhuvan &amp; Manasa wedding, 12 December 2026.">',
  ],
  [
    /<meta name="description" content="[^"]*">/,
    '<meta name="description" content="Wedding accommodation details for family and guests of Bhuvan &amp; Manasa.">',
  ],
];

function staticRoutesPlugin() {
  return {
    name: 'static-spa-routes',
    apply: 'build',
    closeBundle() {
      const distDir = resolve(rootDir, 'dist');
      const indexFile = resolve(distDir, 'index.html');
      if (!existsSync(indexFile)) return;

      let html = readFileSync(indexFile, 'utf8');
      html = html.replace('</head>', '  <meta name="robots" content="noindex, nofollow">\n  </head>');
      for (const [pattern, replacement] of ROUTE_META) {
        html = html.replace(pattern, replacement);
      }

      for (const route of SPA_ROUTES) {
        const routeDir = resolve(distDir, route);
        mkdirSync(routeDir, { recursive: true });
        writeFileSync(resolve(routeDir, 'index.html'), html, 'utf8');
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), staticRoutesPlugin()],
  base: '/',
  build: {
    outDir: 'dist',
  },
});
