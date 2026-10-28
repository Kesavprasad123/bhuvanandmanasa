# AI Guidelines & Repository Global Standards

> See [AGENTS.md](./AGENTS.md) for full details and rules.

This repository enforces strict global standards for page load speed, asset formats, Core Web Vitals, and resource efficiency. Mobile wedding guests must experience near-instant load times even on slow 3G/4G cellular connections.

**ANY AI AGENT OR ENGINEER MODIFYING THIS CODEBASE MUST COMPLY WITH THESE STANDARDS AS FIRST PRIORITY.**

## Key Rules
1. **WebP Only**: Never commit or use `.png`, `.jpg`, or `.jpeg` in production code. Convert them to `.webp` using `cwebp -q 82`.
2. **Raw Photos**: Keep raw original photos in `raw_photos/` (gitignored), never in `public/assets/`.
3. **Preload Critical Assets**: Preload `/assets/Envelope1.webp` and `/assets/Backpic.webp` in `index.html`.
4. **Non-blocking Fonts**: Use `media="print" onload="this.media='all'"` for web fonts.
5. **Code Splitting**: Keep inner sections in `MainInvitation.jsx` lazy-loaded with idle prefetching.
6. **Audio**: Use `<audio preload="none">`.
7. **Verify**: Always run `npm run check:standards` before finishing any task.
