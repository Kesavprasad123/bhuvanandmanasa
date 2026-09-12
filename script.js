  /* =========================================================
    BHUVAN & MANASA — WEDDING INVITATION
    No external JS libraries are required.
    ========================================================= */

  const WEDDING_DATE = new Date('2026-12-12T20:24:00+05:30').getTime();
  const MAPS_URL = 'https://www.google.com/maps/place/SVPC+CONVENTIONS/@17.0438279,81.794505,12.69z/data=!4m6!3m5!1s0x3a37a173580ba0c1:0xf660ea509c425358!8m2!3d17.0387557!4d81.8332866!16s%2Fg%2F11nz344pws?entry=ttu&g_ep=EgoyMDI2MDkwMS4wIKXMDSoASAFQAw%3D%3D';

  const $ = (id) => document.getElementById(id);
  const opening = $('opening');
  const envelope = $('openEnvelope');
  const site = $('site');
  const musicToggle = $('musicToggle');

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
    "assets/kalyanam-vybhogam.mp3",
    "assets/marriage.mp3",
    "assets/Shatamanam Bhavati.mp3",
    "assets/jaya-mangalam.mp3"
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
      musicToggle.classList.add("playing");

      /* Next visit will use the next song */
      songIndex = (songIndex + 1) % weddingSongs.length;
      localStorage.setItem("weddingSongIndex", songIndex);

    } catch (error) {
      console.log("Music could not start:", error);
    }
  }

  /* Stop MP3 */
  function stopWeddingMusic() {
    weddingMusic.pause();

    musicPlaying = false;
    musicToggle.textContent = "♪";
    musicToggle.classList.remove("playing");
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
  const count = window.innerWidth <= 600 ? 18 : 30;

  for (let i = 0; i < count; i++) {

    const flower = document.createElement("span");

    const size = Math.random() * 13 + 10;
    const duration = Math.random() * 10 + 14;
    const delay = -(Math.random() * duration);
    const drift = (Math.random() * 120 - 60).toFixed(0);
    const rotation = Math.floor(Math.random() * 500 + 180);
    const opacity = (Math.random() * 0.25 + 0.25).toFixed(2);
    const blur = Math.random() < 0.25 ? "0.5px" : "0px";

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

