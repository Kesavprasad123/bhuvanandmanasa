---
name: wedding-performance-standards
description: >-
  Strict web performance, media optimization, and architecture standards for the Bhuvan & Manasa wedding invitation website.
  Activate this skill whenever adding or modifying images, audio, fonts, styles, components, or deploying changes to this repository.
---

# Wedding Website Global Performance & Asset Standards

This repository enforces strict global standards for page load speed, asset formats, Core Web Vitals, and resource efficiency. Mobile wedding guests must experience near-instant load times even on slow 3G/4G cellular connections.

**ANY AI AGENT OR ENGINEER MODIFYING THIS CODEBASE MUST COMPLY WITH THESE STANDARDS AS FIRST PRIORITY.**

---

## 1. Mandatory Media Standards

### Rule 1.1: WebP Format Exclusively
- **Disallowed**: Never commit or use `.png`, `.jpg`, `.jpeg`, `.bmp`, `.tiff`, or `.gif` in `public/assets/` or production code.
- **Enforced Format**: All images must be modern `.webp` (or `.svg` for vector icons).
- **Automatic Conversion Rule**:
  If a developer or user adds a `.png` or `.jpg` locally or asks to add a new image:
  1. DO NOT use the `.png`/`.jpg` directly in `src/` or `public/assets/`.
  2. Convert the image to `.webp` using `cwebp`:
     ```bash
     cwebp -q 82 input.png -o output.webp
     # Or use the helper script:
     ./.agents/skills/wedding-performance-standards/scripts/optimize-image.sh input.png 82
     ```
  3. Reference ONLY the `.webp` path in CSS, JSX, and HTML.

### Rule 1.2: Raw Photo Archival (Zero Dist Bloat)
- Never store raw uncompressed camera photos in `public/assets/`.
- Vite copies everything in `public/` directly into `dist/`. Bloating `public/` inflates `dist/`, exceeding deployment and CDN limits.
- Store original high-resolution photography in `raw_photos/` at the repository root. `raw_photos/` is ignored by git and never copied into production builds.

### Rule 1.3: HTML Image Attributes
Every `<img>` element rendered in JSX/HTML must include:
- `loading="lazy"` (except for above-the-fold critical assets)
- `decoding="async"`
- Explicit `width` and `height` (or aspect-ratio CSS) to eliminate Cumulative Layout Shift (CLS).

### Rule 1.4: Dimension Caps
- Full-bleed background images: Max width **1672px**.
- Event cards and portrait photos: Max width **800px** – **1024px**.
- Collage and thumbnail images: Max width **600px** – **800px**.

---

## 2. Page Speed & Loading Sequence Standards

### Rule 2.1: Initial Screen (Envelope) Budget (< 250 KB)
- The opening envelope screen is the first visual impression.
- Total image transfer on the opening screen MUST remain below **250 KB**.
- Above-the-fold envelope assets (`Envelope1.webp` and `Backpic.webp`) MUST be preloaded in `index.html`:
  ```html
  <link rel="preload" as="image" href="/assets/Envelope1.webp" type="image/webp">
  <link rel="preload" as="image" href="/assets/Backpic.webp" type="image/webp">
  ```

### Rule 2.2: Non-Blocking Typography
- Google Fonts or web fonts must NEVER block First Contentful Paint (FCP).
- Use asynchronous non-blocking loading with preconnects:
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preload" as="style" href="<font-url>">
  <link rel="stylesheet" href="<font-url>" media="print" onload="this.media='all'">
  <noscript><link rel="stylesheet" href="<font-url>"></noscript>
  ```

### Rule 2.3: Code-Splitting & Idle Prefetching
- All inner components of the invitation (`Hero`, `Events`, `ScratchCard`, `Gallery`, `Venue`, etc.) MUST remain inside `MainInvitation.jsx` and be loaded via `React.lazy()`:
  ```jsx
  const loadMainInvitation = () => import('./components/MainInvitation');
  const MainInvitation = lazy(loadMainInvitation);
  ```
- While the user views the opening envelope, the browser MUST silently prefetch `loadMainInvitation()` during idle time via `requestIdleCallback`:
  ```jsx
  useEffect(() => {
    const idleCallback = window.requestIdleCallback || ((cb) => setTimeout(cb, 800));
    const id = idleCallback(() => loadMainInvitation());
    return () => (window.cancelIdleCallback ? window.cancelIdleCallback(id) : null);
  }, []);
  ```
- This ensures zero JS bloat on initial paint, while keeping envelope tap transition instantaneous.

### Rule 2.4: Audio Streaming & Preload
- Wedding background music tracks must use `<audio preload="none">`.
- Never use `preload="auto"`. Mobile browsers must not pre-buffer multi-megabyte audio files before the user interacts with the envelope.

---

## 3. Build & Production Verification

Before committing any changes or submitting pull requests, run the verification script:

```bash
npm run check:standards
```

Ensure the production build succeeds cleanly and keeps `dist/` lean:
```bash
npm run build
```

Expected output:
- `dist/` total size must remain under 35 MB.
- Initial JS chunk < 100 KB gzipped.
- Zero `.png` / `.jpg` in `public/assets/`.
