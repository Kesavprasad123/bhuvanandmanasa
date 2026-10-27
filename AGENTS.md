# AI Agent Guidelines & Repository Global Standards

> **CRITICAL INSTRUCTION FOR ALL AI CODING ASSISTANTS & ENGINEERS:**
> Before proposing, editing, or adding any code or assets to this repository, you **MUST** read and adhere to these global standards.
> If a developer asks to add an asset in PNG or JPG format, or if local assets are introduced, you **MUST enforce the repository global standard (WebP)** and convert the asset.

---

## 1. Absolute Rule: Image Formats & Storage

1. **WebP Only in Production (`public/assets/` & CSS/JSX):**
   - **Disallowed**: `.png`, `.jpg`, `.jpeg`, `.bmp`, `.tiff`, `.gif`.
   - **Allowed**: `.webp` (and `.svg` for vector icons).
   - If an engineer introduces a `.png` or `.jpg` or asks to use one:
     - **Do NOT** commit or reference the `.png` / `.jpg`.
     - **Convert it immediately to WebP** using `cwebp` (quality ~80–82):
       ```bash
       cwebp -q 82 input.png -o output.webp
       # Or run:
       ./.agents/skills/wedding-performance-standards/scripts/optimize-image.sh input.png
       ```
     - Reference only the `.webp` file in code.

2. **Never Put Uncompressed Raw Camera Photos in `public/assets/`:**
   - Vite copies the entirety of `public/` into `dist/`.
   - Storing high-res camera photos in `public/` inflates `dist/` beyond hosting and CDN limits.
   - Keep uncompressed source photography in `raw_photos/` (which is gitignored).

3. **HTML / JSX Image Tags:**
   - Always supply `loading="lazy"`, `decoding="async"`, and explicit `width` and `height` (or CSS aspect-ratio) to prevent Cumulative Layout Shift (CLS).

---

## 2. Load Time & Core Web Vitals Rules

1. **Initial Screen (Opening Envelope) Budget < 250 KB:**
   - The opening envelope screen must load instantaneously on mobile networks.
   - Critical above-the-fold assets (`Envelope1.webp`, `Backpic.webp`) must be preloaded in `<head>` of `index.html`.

2. **Asynchronous Font Loading:**
   - Google Fonts or web fonts must never block render.
   - Use `media="print" onload="this.media='all'"` with `<noscript>` fallback.

3. **Code Splitting & Idle Prefetching:**
   - All inner invitation sections (`Hero`, `Events`, `ScratchCard`, `Gallery`, `Venue`, etc.) must remain in `MainInvitation.jsx` and be loaded via `React.lazy()`.
   - App must prefetch `MainInvitation` during idle time (`requestIdleCallback`) while the user is viewing the envelope.
   - Never bundle the inner components synchronously into the root entry chunk.

4. **Audio Element Optimization:**
   - Audio must use `preload="none"`. Never use `preload="auto"`. Mobile users must not buffer multi-megabyte audio files prior to user interaction.

---

## 3. Mandatory Pre-Commit Validation

Before finishing any task, run the standards verification script:

```bash
npm run check:standards
```

Ensure the production build succeeds without warnings or bloat:
```bash
npm run build
```

---

## 4. Associated Skills

For full details, step-by-step procedures, and helper scripts, refer to the workspace skill:
- **`wedding-performance-standards`** located in `.agents/skills/wedding-performance-standards/SKILL.md`.
