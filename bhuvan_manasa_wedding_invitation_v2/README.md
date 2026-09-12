# Bhuvan & Manasa — Wedding Invitation Website

A responsive South Indian wedding invitation website made with plain **HTML + CSS + JavaScript**.

## Included

- Animated B & M envelope opening
- Pink / gold / cream / sage wedding theme
- Bride: **Manasa**
- Groom: **Bhuvan**
- Groom's parents: **Kotti Venkata Subbarao & Smt. Kotti Padma Tulasi**
- Bride's parents: **Manyapu Satya Kiran & Smt. Manyapu Sujatha (Late)**
- Wedding date: **12 December 2026**
- Events: **PelliKoduku, Haldi, Mehendi, Wedding**
- PelliKoduku time: **9:00 AM**
- Wedding venue: **SVPC CONVENTIONS**
- Google Maps button + embedded map
- Countdown timer
- Mobile-first vertical invitation layout
- Wider desktop layout
- Four supplied wedding images used in the event/gallery sections
- Scroll reveal animations
- Background instrumental-style music generated in the browser after the envelope is opened

## Run in VS Code

1. Extract/open this folder in VS Code.
2. Make sure the folder contains:
   - `index.html`
   - `style.css`
   - `script.js`
   - `assets/`
3. Install the **Live Server** extension in VS Code.
4. Right-click `index.html` → **Open with Live Server**.
5. The invitation will open in your browser.

You can also double-click `index.html`, but Live Server is recommended.

## Change event details

Open `index.html` and edit the event cards. The currently unknown dates, times and venues are deliberately shown as **Date/Time/Venue to be announced** so that no details are invented.

## Change the wedding time used by the countdown

Open `script.js` and change:

```js
const WEDDING_DATE = new Date('2026-12-12T10:30:00+05:30').getTime();
```

Replace `10:30` with the actual wedding time.

## Add a specific song

The current site uses a small Web Audio melody so the site works without an external music file. If you want a specific song, place a legally obtained MP3 inside:

```text
assets/music.mp3
```

Then replace the Web Audio music section in `script.js` with an HTML `<audio>` element and start it after the envelope click. Browsers generally require a user interaction before sound can autoplay, which is why the envelope click is used.

## Replace photos

Keep these filenames, or change the paths in `index.html`:

```text
assets/pellikoduku.webp
assets/haldi.png
assets/mehendi.webp
assets/wedding.webp
```

## Deploy

### Netlify
Drag the whole project folder into Netlify's manual deploy area, or connect a Git repository.

### GitHub Pages
Upload the project to a GitHub repository and enable Pages from the repository settings. Because this is a static website, no build process is required.

### Vercel
Import the project/repository and deploy it as a static site. No framework or build command is required.
