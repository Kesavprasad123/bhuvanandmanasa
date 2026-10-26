import { useCallback, useEffect, useRef, useState } from 'react';

/* ---------------------------------------------------------------
   Gold scratch card — HTML5 canvas coating over the hidden date.
   Scratching away ~35% of the foil auto-reveals the surprise.
----------------------------------------------------------------*/

const REVEAL_THRESHOLD = 0.35; // reveal once 35% of the foil is scratched
const CHECK_INTERVAL = 150; // ms between progress samples
const CARD_TEXT = '!! scratch here !!';
const BURST_LIFETIME = 3600; // ms celebration particles stay on screen

const HEART_SYMBOLS = ['💗', '💕', '🩷', '💖', '❤️'];
const SPARKLE_SYMBOLS = ['✦', '✧', '✨', '✵'];
const PETAL_SYMBOLS = ['🌸', '❀', '✿', '🌷'];

function roundedPath(ctx, x, y, width, height, radius) {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawCardText(ctx, width, height) {
  const family = '"Great Vibes", "Brush Script MT", cursive';
  let size = Math.min(width * 0.145, height * 0.2);

  ctx.font = `italic 400 ${size}px ${family}`;
  const maxWidth = width * 0.84;
  const measured = ctx.measureText(CARD_TEXT).width;
  if (measured > maxWidth && measured > 0) {
    size = Math.max(14, size * (maxWidth / measured));
    ctx.font = `italic 400 ${size}px ${family}`;
  }

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(122, 72, 8, .55)';
  ctx.shadowBlur = Math.max(5, size * 0.1);
  ctx.shadowOffsetY = Math.max(1, size * 0.03);
  ctx.fillStyle = 'rgba(255, 255, 255, .97)';
  ctx.fillText(CARD_TEXT, width / 2, height / 2 + size * 0.05);
  ctx.restore();
}

/* Paints the full luxurious gold foil surface (gradient + diagonal
   reflections + soft borders + calligraphy). No icons, no illustration. */
function paintCoating(ctx, width, height) {
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.clearRect(0, 0, width, height);

  // 1 — champagne / honey / antique-gold metallic base
  const base = ctx.createLinearGradient(0, 0, width, height);
  [
    [0.0, '#f8e4b0'],
    [0.1, '#edc97f'],
    [0.22, '#f9ecc6'],
    [0.36, '#e2b45f'],
    [0.5, '#f2d68f'],
    [0.64, '#cd973c'],
    [0.78, '#e8c177'],
    [0.9, '#b5801f'],
    [1.0, '#9a6a18'],
  ].forEach(([stop, color]) => base.addColorStop(stop, color));
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);

  // 2 — diagonal polished-foil reflection bands
  const reach = Math.hypot(width, height);
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(-Math.PI / 4);

  const shadeBands = [
    [-0.52, 0.2, 0.26],
    [-0.06, 0.26, 0.2],
    [0.44, 0.18, 0.22],
  ];
  shadeBands.forEach(([at, span, alpha]) => {
    const centre = at * reach;
    const band = span * reach;
    const gradient = ctx.createLinearGradient(0, centre - band / 2, 0, centre + band / 2);
    gradient.addColorStop(0, 'rgba(154, 101, 18, 0)');
    gradient.addColorStop(0.5, `rgba(154, 101, 18, ${alpha})`);
    gradient.addColorStop(1, 'rgba(154, 101, 18, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(-reach, centre - band / 2, reach * 2, band);
  });

  const lightBands = [
    [-0.58, 0.24, 0.34],
    [-0.3, 0.1, 0.2],
    [-0.12, 0.3, 0.44],
    [0.16, 0.1, 0.22],
    [0.34, 0.26, 0.38],
    [0.62, 0.14, 0.26],
  ];
  lightBands.forEach(([at, span, alpha]) => {
    const centre = at * reach;
    const band = span * reach;
    const gradient = ctx.createLinearGradient(0, centre - band / 2, 0, centre + band / 2);
    gradient.addColorStop(0, 'rgba(255, 253, 244, 0)');
    gradient.addColorStop(0.5, `rgba(255, 253, 244, ${alpha})`);
    gradient.addColorStop(1, 'rgba(255, 253, 244, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(-reach, centre - band / 2, reach * 2, band);
  });

  ctx.restore();

  // 3 — broad top-left sheen
  const sheen = ctx.createRadialGradient(
    width * 0.2,
    height * 0.12,
    0,
    width * 0.2,
    height * 0.12,
    Math.max(width, height) * 0.8
  );
  sheen.addColorStop(0, 'rgba(255, 255, 255, .28)');
  sheen.addColorStop(0.4, 'rgba(255, 255, 255, .07)');
  sheen.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, width, height);

  // 4 — warm antique glow from the bottom-right
  const glow = ctx.createRadialGradient(
    width * 0.86,
    height * 0.92,
    0,
    width * 0.86,
    height * 0.92,
    Math.max(width, height) * 0.75
  );
  glow.addColorStop(0, 'rgba(150, 96, 14, .34)');
  glow.addColorStop(1, 'rgba(150, 96, 14, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  // 5 — thin, soft gold borders
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(150, 104, 30, .35)';
  roundedPath(ctx, 1, 1, width - 2, height - 2, 24);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255, 251, 234, .85)';
  roundedPath(ctx, 5, 5, width - 10, height - 10, 20);
  ctx.stroke();

  // 6 — centred italic calligraphy
  drawCardText(ctx, width, height);
  ctx.restore();
}

function measureProgress(canvas) {
  try {
    const { width, height } = canvas;
    if (!width || !height) return 0;
    const ctx = canvas.getContext('2d');
    const data = ctx.getImageData(0, 0, width, height).data;
    let cleared = 0;
    let total = 0;
    // sample every 4th pixel — plenty accurate, cheap to compute
    for (let i = 3; i < data.length; i += 16) {
      total += 1;
      if (data[i] < 14) cleared += 1;
    }
    return total ? cleared / total : 0;
  } catch (error) {
    return 0;
  }
}

function buildBurst() {
  const particles = [];
  let id = 0;

  const spawn = (kind, symbols, count, options) => {
    for (let i = 0; i < count; i += 1) {
      const pick = (range) => range[0] + Math.random() * (range[1] - range[0]);
      particles.push({
        id: `${kind}-${(id += 1)}`,
        kind,
        symbol: symbols[Math.floor(Math.random() * symbols.length)],
        x: 50 + pick([-options.spreadX, options.spreadX]),
        y: options.y + pick([-options.spreadY, options.spreadY]),
        size: pick(options.size),
        dx: pick(options.dx),
        dy: pick(options.dy),
        scale: pick(options.scale),
        rot: Math.round(pick([-200, 200])),
        duration: pick(options.duration),
        delay: Math.random() * 0.55,
      });
    }
  };

  // pink hearts
  spawn('heart', HEART_SYMBOLS, 14, {
    spreadX: 20, y: 52, spreadY: 14,
    size: [17, 30], dx: [-150, 150], dy: [-215, -70],
    scale: [0.8, 1.7], duration: [1.9, 3.1],
  });
  // champagne-gold sparkles
  spawn('sparkle', SPARKLE_SYMBOLS, 18, {
    spreadX: 26, y: 50, spreadY: 22,
    size: [11, 24], dx: [-195, 195], dy: [-175, 75],
    scale: [0.7, 1.8], duration: [1.6, 2.9],
  });
  // rose petals
  spawn('petal', PETAL_SYMBOLS, 12, {
    spreadX: 30, y: 44, spreadY: 24,
    size: [13, 26], dx: [-135, 135], dy: [65, 185],
    scale: [0.7, 1.5], duration: [2.2, 3.4],
  });

  return particles;
}

function ScratchCard({ onRevealed }) {
  const canvasRef = useRef(null);
  const sizeRef = useRef({ w: 0, h: 0 });
  const dprRef = useRef(1);
  const strokesRef = useRef([]); // recorded strokes, replayed on resize
  const currentStrokeRef = useRef(null);
  const drawingRef = useRef(false);
  const revealedRef = useRef(false);
  const checkTimerRef = useRef(null);
  const burstTimerRef = useRef(null);
  const onRevealedRef = useRef(onRevealed);

  const [revealed, setRevealed] = useState(false);
  const [scratching, setScratching] = useState(false);
  const [burst, setBurst] = useState(null);

  useEffect(() => {
    onRevealedRef.current = onRevealed;
  }, [onRevealed]);

  /* ---------- paint / repaint the foil ---------- */
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const width = Math.round(rect.width);
    const height = Math.round(rect.height);
    if (!width || !height) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    dprRef.current = dpr;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sizeRef.current = { w: width, h: height };

    paintCoating(ctx, width, height);

    const strokes = strokesRef.current;
    if (strokes.length) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      strokes.forEach((stroke) => {
        const points = stroke.points;
        ctx.lineWidth = Math.max(6, stroke.ratio * width);
        if (points.length === 1) {
          ctx.beginPath();
          ctx.arc(
            points[0].x * width,
            points[0].y * height,
            ctx.lineWidth / 2,
            0,
            Math.PI * 2
          );
          ctx.fillStyle = '#000';
          ctx.fill();
          return;
        }
        ctx.beginPath();
        ctx.moveTo(points[0].x * width, points[0].y * height);
        for (let i = 1; i < points.length; i += 1) {
          ctx.lineTo(points[i].x * width, points[i].y * height);
        }
        ctx.stroke();
      });
      ctx.globalCompositeOperation = 'source-over';
    }
  }, []);

  /* ---------- reveal ---------- */
  const reveal = useCallback(() => {
    if (revealedRef.current) return;
    revealedRef.current = true;
    drawingRef.current = false;
    currentStrokeRef.current = null;

    if (checkTimerRef.current) {
      clearTimeout(checkTimerRef.current);
      checkTimerRef.current = null;
    }

    setScratching(false);
    setRevealed(true);
    setBurst(buildBurst());

    if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
    burstTimerRef.current = setTimeout(() => setBurst(null), BURST_LIFETIME);

    if (onRevealedRef.current) onRevealedRef.current();
  }, []);

  const checkProgress = useCallback(() => {
    if (revealedRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const progress = measureProgress(canvas);
    if (progress >= REVEAL_THRESHOLD) reveal();
  }, [reveal]);

  const scheduleCheck = useCallback(() => {
    if (checkTimerRef.current || revealedRef.current) return;
    checkTimerRef.current = setTimeout(() => {
      checkTimerRef.current = null;
      checkProgress();
    }, CHECK_INTERVAL);
  }, [checkProgress]);

  /* ---------- pointer helpers ---------- */
  const brushRatio = (width) =>
    Math.max(20, Math.min(48, width * 0.065)) / Math.max(width, 1);

  const toLocal = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
      w: rect.width,
      h: rect.height,
    };
  };

  const erase = (from, to, ratio) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { w, h } = sizeRef.current;
    const ctx = canvas.getContext('2d');
    ctx.save();
    const dpr = dprRef.current;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(6, ratio * w);

    if (!from) {
      ctx.beginPath();
      ctx.arc(to.x * w, to.y * h, ctx.lineWidth / 2, 0, Math.PI * 2);
      ctx.fillStyle = '#000';
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(from.x * w, from.y * h);
      ctx.lineTo(to.x * w, to.y * h);
      ctx.stroke();
    }
    ctx.restore();
  };

  const handlePointerDown = (event) => {
    if (revealedRef.current) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    event.preventDefault();
    drawingRef.current = true;
    setScratching(true);

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch (error) {
      /* pointer capture is a bonus, not a requirement */
    }

    const point = toLocal(event);
    const stroke = {
      ratio: brushRatio(point.w),
      points: [{ x: point.x, y: point.y }],
    };
    strokesRef.current.push(stroke);
    currentStrokeRef.current = stroke;

    erase(null, point, stroke.ratio);
    scheduleCheck();
  };

  const handlePointerMove = (event) => {
    if (!drawingRef.current || revealedRef.current) return;
    const stroke = currentStrokeRef.current;
    if (!stroke) return;

    let events = [event];
    const native = event.nativeEvent;
    if (native && typeof native.getCoalescedEvents === 'function') {
      try {
        const coalesced = native.getCoalescedEvents();
        if (coalesced && coalesced.length) events = coalesced;
      } catch (error) {
        /* fall back to the single event */
      }
    }

    for (let i = 0; i < events.length; i += 1) {
      const point = toLocal(events[i]);
      const last = stroke.points[stroke.points.length - 1];
      const dx = (point.x - last.x) * point.w;
      const dy = (point.y - last.y) * point.h;
      if (dx * dx + dy * dy < 1.6) continue;
      stroke.points.push({ x: point.x, y: point.y });
      erase(last, point, stroke.ratio);
    }

    scheduleCheck();
  };

  const endScratch = (event) => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    currentStrokeRef.current = null;
    setScratching(false);

    if (event && event.currentTarget && typeof event.currentTarget.releasePointerCapture === 'function') {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch (error) {
        /* already released */
      }
    }

    checkProgress();
  };

  /* ---------- setup: paint, resize, fonts, cleanup ---------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    let disposed = false;
    let frame = 0;

    const handleResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!disposed) redraw();
      });
    };

    redraw();

    const observer =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(handleResize) : null;
    if (observer) observer.observe(canvas);

    window.addEventListener('orientationchange', handleResize);

    const fonts = document.fonts;
    if (fonts) {
      if (typeof fonts.load === 'function') {
        fonts.load('italic 400 40px "Great Vibes"').catch(() => {});
      }
      if (fonts.ready && typeof fonts.ready.then === 'function') {
        fonts.ready.then(() => {
          if (!disposed) redraw();
        }).catch(() => {});
      }
    }

    // page scrolling stays available everywhere except mid-scratch
    const preventScroll = (event) => {
      if (drawingRef.current && !revealedRef.current && event.cancelable) {
        event.preventDefault();
      }
    };
    canvas.addEventListener('touchmove', preventScroll, { passive: false });

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      if (observer) observer.disconnect();
      window.removeEventListener('orientationchange', handleResize);
      canvas.removeEventListener('touchmove', preventScroll);
      if (checkTimerRef.current) clearTimeout(checkTimerRef.current);
      if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
      checkTimerRef.current = null;
      burstTimerRef.current = null;
      strokesRef.current = [];
      currentStrokeRef.current = null;
      drawingRef.current = false;
    };
  }, [redraw]);

  const cardClasses = [
    'scratch-card',
    revealed ? 'is-revealed' : '',
    scratching ? 'is-scratching' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="scratch-wrap">
      <div className={cardClasses}>
        <div className="scratch-underlay">
          <div className="scratch-underlay-content">
            <p className="scratch-names">
              Bhuvan <span className="scratch-heart">🩷</span> Manasa
            </p>
            <p className="scratch-date">12 December 2026</p>
            <p className="scratch-time">8:26 PM IST</p>
          </div>
        </div>

        <canvas
          ref={canvasRef}
          className="scratch-canvas"
          aria-hidden="true"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endScratch}
          onPointerCancel={endScratch}
          onLostPointerCapture={endScratch}
        />
      </div>

      {burst && (
        <div className="scratch-burst" aria-hidden="true">
          {burst.map((particle) => (
            <span
              key={particle.id}
              className={`burst-particle burst-${particle.kind}`}
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                fontSize: `${Math.round(particle.size)}px`,
                animationDuration: `${particle.duration.toFixed(2)}s`,
                animationDelay: `${particle.delay.toFixed(2)}s`,
                '--dx': `${Math.round(particle.dx)}px`,
                '--dy': `${Math.round(particle.dy)}px`,
                '--scale': particle.scale.toFixed(2),
                '--rot': `${particle.rot}deg`,
              }}
            >
              {particle.symbol}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default ScratchCard;
