import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const DISALLOWED_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.bmp', '.tiff', '.gif'];
const MAX_RECOMMENDED_IMAGE_KB = 300;

console.log('🔍 Checking repository global performance & asset standards...\n');

let hasErrors = false;

// 1. Check public/assets for disallowed legacy image formats
const assetsDir = path.join(projectRoot, 'public', 'assets');
function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(fullPath);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      const relPath = path.relative(projectRoot, fullPath);

      if (DISALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
        console.error(`❌ DISALLOWED IMAGE FORMAT: "${relPath}"`);
        console.error(
          `   👉 Global standard requires WebP (.webp). Convert using: cwebp -q 82 "${relPath}" -o "${relPath.replace(ext, '.webp')}"`
        );
        console.error(`   👉 Store original uncompressed raw photos in "raw_photos/" (gitignored), NOT in "public/assets/".\n`);
        hasErrors = true;
      } else if (ext === '.webp') {
        const stats = fs.statSync(fullPath);
        const sizeKb = Math.round(stats.size / 1024);
        if (sizeKb > MAX_RECOMMENDED_IMAGE_KB) {
          console.warn(`⚠️  LARGE WEBP IMAGE: "${relPath}" is ${sizeKb} KB (recommended <= ${MAX_RECOMMENDED_IMAGE_KB} KB).`);
        }
      }
    }
  }
}

scanDir(assetsDir);

// 2. Check index.html and accommodation/index.html for critical preloads and non-blocking font loading
const htmlFiles = [
  { path: path.join(projectRoot, 'index.html'), isMain: true },
  { path: path.join(projectRoot, 'accommodation', 'index.html'), isMain: false },
];

for (const htmlFile of htmlFiles) {
  if (fs.existsSync(htmlFile.path)) {
    const htmlContent = fs.readFileSync(htmlFile.path, 'utf8');
    const relHtml = path.relative(projectRoot, htmlFile.path);

    if (htmlFile.isMain && (!htmlContent.includes('rel="preload"') || !htmlContent.includes('Envelope1.webp'))) {
      console.warn(`⚠️  ${relHtml} is missing preload link for /assets/Envelope1.webp`);
    }
    if (htmlContent.includes('<link href="https://fonts.googleapis.com') && !htmlContent.includes('display=swap')) {
      console.error(`❌ RENDER-BLOCKING FONTS: Google Fonts link in ${relHtml} is missing display=swap.`);
      console.error('   👉 Add display=swap to the Google Fonts URL query parameters.\n');
      hasErrors = true;
    }
    for (const ext of DISALLOWED_IMAGE_EXTENSIONS) {
      if (htmlContent.includes(ext)) {
        console.error(`❌ DISALLOWED IMAGE REFERENCE: ${relHtml} references "${ext}". Use WebP instead.\n`);
        hasErrors = true;
      }
    }
  }
}

// 3. Check App.jsx for code splitting and audio preload
const appJsxPath = path.join(projectRoot, 'src', 'App.jsx');
if (fs.existsSync(appJsxPath)) {
  const appJsx = fs.readFileSync(appJsxPath, 'utf8');
  if (appJsx.includes('preload="auto"')) {
    console.error('❌ AUDIO PRELOAD: src/App.jsx has preload="auto" on audio element.');
    console.error('   👉 Global standard requires preload="none" to prevent high mobile data usage before user interaction.\n');
    hasErrors = true;
  }
  if (!appJsx.includes('lazy(') || !appJsx.includes('MainInvitation')) {
    console.error('❌ CODE SPLITTING: Main invitation content is not lazy loaded.');
    console.error('   👉 Global standard requires lazy loading MainInvitation with idle prefetching.\n');
    hasErrors = true;
  }
}

if (hasErrors) {
  console.error('❌ Performance standards check FAILED. Please fix the above issues before committing.');
  process.exit(1);
} else {
  console.log('✅ All global performance and asset standards PASSED!');
  process.exit(0);
}
