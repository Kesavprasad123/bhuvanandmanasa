import { useEffect, useMemo } from 'react';

const FLOWER_SYMBOLS = ['❀', '✿', '❁', '🌸'];
const COLORS = ['#d99aa3', '#bd8a42', '#e4c994', '#aab59b', '#8e3045'];

// Pre-defined flowers for SSR/initial render
const STATIC_FLOWERS = [
  { left: '2%', size: '18px', color: '#d99aa3', duration: '14s', delay: '-2s', drift: '35px', rotation: '240deg', opacity: '.55', blur: '0px', symbol: '❀' },
  { left: '7%', size: '13px', color: '#bd8a42', duration: '18s', delay: '-9s', drift: '-45px', rotation: '320deg', opacity: '.45', blur: '.2px', symbol: '✿' },
  { left: '11%', size: '22px', color: '#aab59b', duration: '16s', delay: '-5s', drift: '50px', rotation: '280deg', opacity: '.50', blur: '.3px', symbol: '❁' },
  { left: '16%', size: '15px', color: '#d99aa3', duration: '20s', delay: '-14s', drift: '-35px', rotation: '400deg', opacity: '.42', blur: '0px', symbol: '🌸' },
  { left: '21%', size: '19px', color: '#e4c994', duration: '13s', delay: '-7s', drift: '40px', rotation: '220deg', opacity: '.50', blur: '.2px', symbol: '✿' },
  { left: '26%', size: '12px', color: '#aab59b', duration: '19s', delay: '-11s', drift: '-55px', rotation: '330deg', opacity: '.40', blur: '.3px', symbol: '❀' },
  { left: '31%', size: '21px', color: '#d99aa3', duration: '15s', delay: '-3s', drift: '45px', rotation: '300deg', opacity: '.52', blur: '0px', symbol: '🌸' },
  { left: '36%', size: '14px', color: '#bd8a42', duration: '22s', delay: '-17s', drift: '-40px', rotation: '360deg', opacity: '.43', blur: '.2px', symbol: '❁' },
  { left: '41%', size: '18px', color: '#aab59b', duration: '17s', delay: '-8s', drift: '55px', rotation: '250deg', opacity: '.48', blur: '.4px', symbol: '✿' },
  { left: '46%', size: '13px', color: '#d99aa3', duration: '21s', delay: '-13s', drift: '-30px', rotation: '420deg', opacity: '.45', blur: '0px', symbol: '❀' },
  { left: '51%', size: '23px', color: '#e4c994', duration: '14s', delay: '-6s', drift: '45px', rotation: '310deg', opacity: '.50', blur: '.3px', symbol: '🌸' },
  { left: '56%', size: '15px', color: '#aab59b', duration: '18s', delay: '-16s', drift: '-50px', rotation: '270deg', opacity: '.42', blur: '.2px', symbol: '❁' },
  { left: '61%', size: '19px', color: '#d99aa3', duration: '16s', delay: '-4s', drift: '35px', rotation: '380deg', opacity: '.53', blur: '0px', symbol: '✿' },
  { left: '66%', size: '12px', color: '#bd8a42', duration: '20s', delay: '-12s', drift: '-45px', rotation: '230deg', opacity: '.40', blur: '.3px', symbol: '❀' },
  { left: '71%', size: '21px', color: '#aab59b', duration: '15s', delay: '-9s', drift: '50px', rotation: '350deg', opacity: '.48', blur: '.2px', symbol: '🌸' },
  { left: '76%', size: '14px', color: '#d99aa3', duration: '23s', delay: '-19s', drift: '-55px', rotation: '290deg', opacity: '.43', blur: '0px', symbol: '❁' },
  { left: '80%', size: '18px', color: '#e4c994', duration: '17s', delay: '-5s', drift: '40px', rotation: '410deg', opacity: '.50', blur: '.3px', symbol: '✿' },
  { left: '84%', size: '13px', color: '#aab59b', duration: '19s', delay: '-15s', drift: '-35px', rotation: '260deg', opacity: '.42', blur: '.2px', symbol: '❀' },
  { left: '88%', size: '22px', color: '#d99aa3', duration: '14s', delay: '-8s', drift: '55px', rotation: '340deg', opacity: '.52', blur: '0px', symbol: '🌸' },
  { left: '92%', size: '15px', color: '#bd8a42', duration: '21s', delay: '-18s', drift: '-45px', rotation: '300deg', opacity: '.44', blur: '.3px', symbol: '❁' },
  { left: '96%', size: '19px', color: '#aab59b', duration: '16s', delay: '-10s', drift: '35px', rotation: '390deg', opacity: '.48', blur: '.2px', symbol: '✿' },
  { left: '18%', size: '11px', color: '#e4c994', duration: '24s', delay: '-20s', drift: '-60px', rotation: '450deg', opacity: '.38', blur: '.4px', symbol: '❀' },
  { left: '58%', size: '11px', color: '#d99aa3', duration: '22s', delay: '-21s', drift: '60px', rotation: '320deg', opacity: '.40', blur: '.4px', symbol: '✿' },
  { left: '74%', size: '10px', color: '#bd8a42', duration: '25s', delay: '-22s', drift: '-50px', rotation: '400deg', opacity: '.35', blur: '.5px', symbol: '❁' },
];

function FallingFlowers() {
  // Generate additional dynamic flowers on mount
  const dynamicFlowers = useMemo(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 600;
    const count = isMobile ? 8 : 14;
    const flowers = [];

    for (let i = 0; i < count; i++) {
      const size = Math.random() * 13 + 10;
      const duration = Math.random() * 10 + 14;
      const delay = -(Math.random() * duration);
      const drift = (Math.random() * 120 - 60).toFixed(0);
      const rotation = Math.floor(Math.random() * 500 + 180);
      const opacity = (Math.random() * 0.25 + 0.25).toFixed(2);

      flowers.push({
        left: `${Math.random() * 100}%`,
        size: `${size}px`,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        duration: `${duration}s`,
        delay: `${delay}s`,
        drift: `${drift}px`,
        rotation: `${rotation}deg`,
        opacity,
        blur: '0px',
        symbol: FLOWER_SYMBOLS[Math.floor(Math.random() * FLOWER_SYMBOLS.length)],
      });
    }

    return flowers;
  }, []);

  const allFlowers = [...STATIC_FLOWERS, ...dynamicFlowers];

  return (
    <div className="falling-flowers" id="fallingFlowers" aria-hidden="true">
      {allFlowers.map((f, i) => (
        <span
          key={i}
          style={{
            '--left': f.left,
            '--size': f.size,
            '--color': f.color,
            '--duration': f.duration,
            '--delay': f.delay,
            '--drift': f.drift,
            '--rotation': f.rotation,
            '--opacity': f.opacity,
            '--blur': f.blur,
          }}
        >
          {f.symbol}
        </span>
      ))}
    </div>
  );
}

export default FallingFlowers;
