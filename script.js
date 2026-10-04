  /* =========================================================
    BHUVAN & MANASA — WEDDING INVITATION
    No external JS libraries are required.
    ========================================================= */

  const WEDDING_DATE = new Date('2026-12-12T20:23:00+05:30').getTime();
  const MAPS_URL = 'https://www.google.com/maps/place/SVPC+CONVENTIONS/@17.0438279,81.794505,12.69z/data=!4m6!3m5!1s0x3a37a173580ba0c1:0xf660ea509c425358!8m2!3d17.0387557!4d81.8332866!16s%2Fg%2F11nz344pws?entry=ttu&g_ep=EgoyMDI2MDkwMS4wIKXMDSoASAFQAw%3D%3D';

  const $ = (id) => document.getElementById(id);
  const opening = $('opening');
  const envelope = $('openEnvelope');
  const site = $('site');
  const musicToggle = $('musicToggle');
  const themeToggle = $('themeToggle');

  function applyTheme(isDark) {
    document.body.classList.toggle('dark-theme', isDark);
    themeToggle.textContent = isDark ? '☀' : '☾';
    themeToggle.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
    themeToggle.setAttribute('aria-pressed', String(isDark));
  }

  const savedTheme = localStorage.getItem('weddingTheme') === 'dark';
  applyTheme(savedTheme);

  themeToggle.addEventListener('click', () => {
    const isDark = !document.body.classList.contains('dark-theme');
    applyTheme(isDark);
    localStorage.setItem('weddingTheme', isDark ? 'dark' : 'light');
  });

  document.querySelectorAll('.event-card--flip').forEach((card) => {
    const frontToggle = card.querySelector('.event-card-front-toggle');
    const back = card.querySelector('.event-card-back');
    const mapLink = back.querySelector('.event-map-button');
    const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    function setFlipped(isFlipped) {
      card.classList.toggle('is-flipped', isFlipped);
      frontToggle.setAttribute('aria-expanded', String(isFlipped));
      frontToggle.inert = isFlipped;
      back.inert = !isFlipped;
      back.setAttribute('aria-hidden', String(!isFlipped));
    }

    frontToggle.addEventListener('click', () => {
      setFlipped(true);
      mapLink.focus();
    });

    back.addEventListener('click', (event) => {
      if (event.target.closest('.event-map-button')) return;
      setFlipped(false);
      frontToggle.focus();
    });

    card.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || !card.classList.contains('is-flipped')) return;
      setFlipped(false);
      frontToggle.focus();
    });

    if (supportsHover) {
      card.addEventListener('pointerenter', (event) => {
        if (event.pointerType === 'mouse' && !card.contains(document.activeElement)) {
          setFlipped(true);
        }
      });

      card.addEventListener('pointerleave', (event) => {
        if (event.pointerType === 'mouse') setFlipped(false);
      });
    }

    document.addEventListener('pointerdown', (event) => {
      if (!card.contains(event.target)) setFlipped(false);
    });
  });

  /* ---------- ENVELOPE ---------- */
envelope.addEventListener('click', () => { 
  if (envelope.classList.contains('open')) return; 

  envelope.classList.add('open');

  // ✨ ONE-TIME CELEBRATION BLAST
  createEnvelopeBlast();

  startWeddingMusic(); 

    setTimeout(() => {
      opening.classList.add('exit');
      site.hidden = false;
      document.body.classList.remove('locked');
      window.scrollTo(0, 0);
      initReveal();
      initScratchCard();
    }, 1550);

    setTimeout(() => {
      opening.style.display = 'none';
    }, 2500);
  });

/* =========================================================
   ✨ ENVELOPE CELEBRATION BLAST
   Random flower + sparkle burst
   ========================================================= */

function createEnvelopeBlast() {

  // Don't create another blast
  if (document.querySelector('.js-blast')) return;

  const blast = document.createElement('div');

  blast.className = 'js-blast';

  blast.setAttribute('aria-hidden', 'true');

  envelope.appendChild(blast);


  const symbols = [
    '❀',
    '✿',
    '❁',
    '✦',
    '✧',
    '•'
  ];


  const colors = [
    '#d99aa3', // dusty rose
    '#bd8a42', // gold
    '#e4c994', // light gold
    '#aab59b', // sage
    '#8e3045'  // dark rose
  ];


  // More particles on desktop
  const particleCount =
    window.innerWidth <= 600 ? 30 : 50;


  for (let i = 0; i < particleCount; i++) {

    const particle = document.createElement('span');


    /* Random symbol */

    particle.textContent =
      symbols[
        Math.floor(Math.random() * symbols.length)
      ];


    /* Random direction */

    const angle =
      Math.random() * Math.PI * 2;


    /* Wide distance */

    const distance =
      window.innerWidth <= 600
        ? 130 + Math.random() * 130
        : 190 + Math.random() * 190;


    const x =
      Math.cos(angle) * distance;


    const y =
      Math.sin(angle) * distance;


    /* Random size */

    const size =
      7 + Math.random() * 14;


    /* Random animation speed */

    const duration =
      750 + Math.random() * 650;


    /* Random delay */

    const delay =
      Math.random() * 100;


    /* Random rotation */

    const rotation =
      -360 + Math.random() * 720;


    /* Random scale */

    const scale =
      .65 + Math.random() * .65;


    particle.style.setProperty(
      '--x',
      `${x}px`
    );

    particle.style.setProperty(
      '--y',
      `${y}px`
    );

    particle.style.setProperty(
      '--size',
      `${size}px`
    );

    particle.style.setProperty(
      '--duration',
      `${duration}ms`
    );

    particle.style.setProperty(
      '--delay',
      `${delay}ms`
    );

    particle.style.setProperty(
      '--rotation',
      `${rotation}deg`
    );

    particle.style.setProperty(
      '--scale',
      scale
    );


    particle.style.color =
      colors[
        Math.floor(Math.random() * colors.length)
      ];


    blast.appendChild(particle);
  }


  /* Remove particles after animation */

  setTimeout(() => {

    blast.remove();

  }, 1800);

}



  /* ---------- COUNTDOWN ---------- */
  function updateCountdown() {
    const remaining = Math.max(0, WEDDING_DATE - Date.now());
    const days = Math.floor(remaining / 86400000);
    const hours = Math.floor(remaining / 3600000) % 24;
    const minutes = Math.floor(remaining / 60000) % 60;
    const seconds = Math.floor(remaining / 1000) % 60;

    $('days').textContent = String(days).padStart(2, '0');
    $('hours').textContent = String(hours).padStart(2, '0');
    $('minutes').textContent = String(minutes).padStart(2, '0');
    $('seconds').textContent = String(seconds).padStart(2, '0');
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);

  /* ---------- SCROLL REVEAL ---------- */
  function initReveal() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
  }


  /* ---------- WEDDING MP3 MUSIC ---------- */

  const weddingMusic = document.getElementById("weddingMusic");

  const weddingSongs = [
    "assets/Raarandoi-veduka-choodham-fixed.mp3",
    "assets/kalyanam-vybhogam.mp3",
    "assets/marriage.mp3"
  ];

  let musicPlaying = false;

  /* Remember which song should play next */
  let songIndex = Number(localStorage.getItem("weddingSongIndex") || 0);

  /* Start MP3 after envelope is clicked */
  async function startWeddingMusic() {
    try {

      weddingMusic.src = weddingSongs[songIndex];
      weddingMusic.volume = 0.7;

      await weddingMusic.play();

      musicPlaying = true;
      musicToggle.textContent = "🔊";
      musicToggle.setAttribute("aria-label", "Pause wedding music");
      musicToggle.setAttribute("aria-pressed", "true");
      musicToggle.classList.add("playing");

      /* Next visit will use the next song */
      songIndex = (songIndex + 1) % weddingSongs.length;
      localStorage.setItem("weddingSongIndex", songIndex);

    } catch (error) {
      musicPlaying = false;
      musicToggle.textContent = "♪";
      musicToggle.setAttribute("aria-label", "Play wedding music");
      musicToggle.setAttribute("aria-pressed", "false");
      console.warn("Wedding music is unavailable:", error.message);
    }
  }

  /* Stop MP3 */
  function stopWeddingMusic() {
    weddingMusic.pause();

    musicPlaying = false;
    musicToggle.textContent = "♪";
    musicToggle.classList.remove("playing");
    musicToggle.setAttribute("aria-label", "Play wedding music");
    musicToggle.setAttribute("aria-pressed", "false");
  }

  /* Music button */
  musicToggle.addEventListener("click", async () => {

    if (musicPlaying) {
      stopWeddingMusic();
    } else {
      await startWeddingMusic();
    }

  });

/* ---------- SMOOTH SCROLL ---------- */

document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));

    if (!target) return;

    e.preventDefault();

    target.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  });
});

// =========================================================
// CONTINUOUS FALLING FLOWERS
// CSS handles the animation.
// JS only creates naturally randomized petals.
// =========================================================

(function () {

  const container = document.getElementById("fallingFlowers");

  if (!container) return;

  const flowers = ["❀", "✿", "❁", "🌸"];

  const colors = [
    "#d99aa3", // dusty rose
    "#bd8a42", // gold
    "#e4c994", // light gold
    "#aab59b", // sage
    "#8e3045"  // rose dark
  ];

  // Fewer flowers on mobile
  const count = window.innerWidth <= 600 ? 8 : 14;

  for (let i = 0; i < count; i++) {

    const flower = document.createElement("span");

    const size = Math.random() * 13 + 10;
    const duration = Math.random() * 10 + 14;
    const delay = -(Math.random() * duration);
    const drift = (Math.random() * 120 - 60).toFixed(0);
    const rotation = Math.floor(Math.random() * 500 + 180);
    const opacity = (Math.random() * 0.25 + 0.25).toFixed(2);
    const blur = "0px";

    flower.textContent =
      flowers[Math.floor(Math.random() * flowers.length)];

    flower.style.setProperty(
      "--left",
      Math.random() * 100 + "%"
    );

    flower.style.setProperty(
      "--size",
      size + "px"
    );

    flower.style.setProperty(
      "--color",
      colors[Math.floor(Math.random() * colors.length)]
    );

    flower.style.setProperty(
      "--duration",
      duration + "s"
    );

    flower.style.setProperty(
      "--delay",
      delay + "s"
    );

    flower.style.setProperty(
      "--drift",
      drift + "px"
    );

    flower.style.setProperty(
      "--rotation",
      rotation + "deg"
    );

    flower.style.setProperty(
      "--opacity",
      opacity
    );

    flower.style.setProperty(
      "--blur",
      blur
    );

    container.appendChild(flower);
  }

})();



  /* ---------- RESPECT REDUCED MOTION ---------- */

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.style.scrollBehavior = 'auto';
  }


/* =========================================================
   SCRATCH CARD (replaces countdown until scratched)
   ========================================================= */
function initScratchCard() {
  const card = document.getElementById('scratchCard');
  const canvas = document.getElementById('scratchCanvas');
  const wrap = document.getElementById('scratchWrap');
  const done = document.getElementById('scratchDone');
  if (!card || !canvas || !wrap || !done || card.dataset.init) return;
  card.dataset.init = '1';
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  let scratching = false, completed = false, checks = 0, last = null;

  function sizeCanvas() {
    const rect = card.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(rect.width));
    canvas.height = Math.max(1, Math.floor(rect.height));
    paintCoating();
  }

  function paintCoating() {
    const w = canvas.width, h = canvas.height;
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#e9cd93');
    grad.addColorStop(.35, '#c99b4a');
    grad.addColorStop(.55, '#a8772f');
    grad.addColorStop(.75, '#e3c584');
    grad.addColorStop(1, '#bd8a42');
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    const shine = ctx.createLinearGradient(0, 0, w, h * .6);
    shine.addColorStop(0, 'rgba(255,255,255,.28)');
    shine.addColorStop(.5, 'rgba(255,255,255,0)');
    ctx.fillStyle = shine;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,248,232,.9)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `400 ${Math.max(28, Math.floor(w * 0.11))}px "Great Vibes", cursive`;
    ctx.fillText('!! scratch here !!', w / 2, h / 2);
  }

  sizeCanvas();

  function getPos(e) {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (canvas.width / r.width), y: (e.clientY - r.top) * (canvas.height / r.height) };
  }
  function scratchAt(x, y, prev) {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(28, canvas.width * 0.09);
    ctx.strokeStyle = 'rgba(0,0,0,1)';
    ctx.beginPath();
    ctx.moveTo(prev ? prev.x : x, prev ? prev.y : y);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
  function onDown(e) {
    if (completed) return;
    scratching = true;
    try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
    const p = getPos(e); scratchAt(p.x, p.y, null); last = p; e.preventDefault();
  }
  function onMove(e) {
    if (!scratching || completed) return;
    const p = getPos(e); scratchAt(p.x, p.y, last); last = p;
    if (++checks % 6 === 0) checkProgress();
    e.preventDefault();
  }
  function onUp() { if (!scratching) return; scratching = false; last = null; checkProgress(); }
  function scratchedPercent() {
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let cleared = 0, total = 0;
    for (let i = 3; i < data.length; i += 16) { total++; if (data[i] < 128) cleared++; }
    return cleared / total;
  }
  function checkProgress() { if (!completed && scratchedPercent() >= 0.65) finishScratch(); }
  function finishScratch() {
    completed = true;
    canvas.removeEventListener('pointerdown', onDown);
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerup', onUp);
    canvas.removeEventListener('pointercancel', onUp);
    canvas.style.opacity = '0';
    createScratchBlast();
    setTimeout(() => { wrap.hidden = true; done.hidden = false; }, 800);
  }

  function createScratchBlast() {
    if (document.querySelector('#scratchWrap .js-blast')) return;
    const blast = document.createElement('div');
    blast.className = 'js-blast';
    blast.setAttribute('aria-hidden', 'true');
    wrap.appendChild(blast);
    const symbols = ['❀', '✿', '❁', '✦', '✧', '•'];
    const colors = ['#d99aa3', '#bd8a42', '#e4c994', '#aab59b', '#8e3045'];
    const count = window.innerWidth <= 600 ? 30 : 50;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      const angle = Math.random() * Math.PI * 2;
      const distance = window.innerWidth <= 600 ? 120 + Math.random() * 120 : 180 + Math.random() * 160;
      p.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      p.style.setProperty('--x', `${Math.cos(angle) * distance}px`);
      p.style.setProperty('--y', `${Math.sin(angle) * distance}px`);
      p.style.setProperty('--size', `${7 + Math.random() * 14}px`);
      p.style.setProperty('--duration', `${750 + Math.random() * 650}ms`);
      p.style.setProperty('--delay', `${Math.random() * 100}ms`);
      p.style.setProperty('--rotation', `${-360 + Math.random() * 720}deg`);
      p.style.setProperty('--scale', `${.65 + Math.random() * .65}`);
      p.style.color = colors[Math.floor(Math.random() * colors.length)];
      blast.appendChild(p);
    }
    setTimeout(() => blast.remove(), 1800);
  }

  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
}

/* ---------- DISTANCE TO VENUE ---------- */
(function () {
  const el = document.getElementById('venueDistance');
  if (!el || !('geolocation' in navigator)) return;
  const VENUE = { lat: 17.0387557, lon: 81.8332866 };
  function haversine(a, b) {
    const R = 6371, dLat = (b.lat - a.lat) * Math.PI / 180, dLon = (b.lon - a.lon) * Math.PI / 180;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  navigator.geolocation.getCurrentPosition((pos) => {
    const km = haversine({ lat: pos.coords.latitude, lon: pos.coords.longitude }, VENUE);
    el.textContent = `?? Distance from you: ${km < 1 ? Math.round(km * 1000) + ' m' : km.toFixed(1) + ' km'}`;
    el.hidden = false;
  }, () => {} /* permission denied � stay hidden */, { timeout: 10000 });
})();
