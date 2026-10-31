import { useState, useCallback, useRef, useEffect } from 'react';

const BLAST_SYMBOLS = ['❀', '✿', '❁', '✦', '✧', '•'];
const BLAST_COLORS = ['#d99aa3', '#bd8a42', '#e4c994', '#aab59b', '#8e3045'];

// Pre-defined HTML blast particles (for CSS-only animation)
const STATIC_BLAST = [
  { x: '-120px', y: '0px', size: '14px', color: '#d99aa3', delay: '0s', symbol: '❀' },
  { x: '-130px', y: '-75px', size: '10px', color: '#e4c994', delay: '.02s', symbol: '✦' },
  { x: '-70px', y: '-120px', size: '16px', color: '#aab59b', delay: '.04s', symbol: '✿' },
  { x: '0px', y: '-160px', size: '12px', color: '#d99aa3', delay: '.01s', symbol: '❁' },
  { x: '70px', y: '-120px', size: '15px', color: '#bd8a42', delay: '.05s', symbol: '❀' },
  { x: '130px', y: '-75px', size: '11px', color: '#e4c994', delay: '.03s', symbol: '✦' },
  { x: '150px', y: '0px', size: '14px', color: '#aab59b', delay: '0s', symbol: '✿' },
  { x: '120px', y: '80px', size: '13px', color: '#d99aa3', delay: '.04s', symbol: '❁' },
  { x: '75px', y: '130px', size: '10px', color: '#bd8a42', delay: '.02s', symbol: '❀' },
  { x: '0px', y: '145px', size: '16px', color: '#e4c994', delay: '.01s', symbol: '✦' },
  { x: '-75px', y: '130px', size: '12px', color: '#aab59b', delay: '.05s', symbol: '✿' },
  { x: '-130px', y: '75px', size: '15px', color: '#d99aa3', delay: '.03s', symbol: '❁' },
];

function Opening({ isOpen: siteOpen, onOpen }) {
  const [envelopeOpen, setEnvelopeOpen] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [jsBlastParticles, setJsBlastParticles] = useState([]);
  const blastCreated = useRef(false);

  useEffect(() => {
    if (siteOpen && !hidden) {
      setHidden(true);
    }
  }, [siteOpen, hidden]);

  const createEnvelopeBlast = useCallback(() => {
    if (blastCreated.current) return;
    blastCreated.current = true;

    const isMobile = window.innerWidth <= 600;
    const particleCount = isMobile ? 30 : 50;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = isMobile
        ? 130 + Math.random() * 130
        : 190 + Math.random() * 190;

      particles.push({
        symbol: BLAST_SYMBOLS[Math.floor(Math.random() * BLAST_SYMBOLS.length)],
        color: BLAST_COLORS[Math.floor(Math.random() * BLAST_COLORS.length)],
        x: `${Math.cos(angle) * distance}px`,
        y: `${Math.sin(angle) * distance}px`,
        size: `${7 + Math.random() * 14}px`,
        duration: `${750 + Math.random() * 650}ms`,
        delay: `${Math.random() * 100}ms`,
        rotation: `${-360 + Math.random() * 720}deg`,
        scale: 0.65 + Math.random() * 0.65,
      });
    }

    setJsBlastParticles(particles);

    // Clean up after animation
    setTimeout(() => {
      setJsBlastParticles([]);
    }, 1800);
  }, []);

  const handleClick = useCallback(() => {
    if (envelopeOpen) return;
    setEnvelopeOpen(true);
    createEnvelopeBlast();
    onOpen();

    setTimeout(() => {
      setExiting(true);
    }, 1550);

    setTimeout(() => {
      setHidden(true);
    }, 2500);
  }, [envelopeOpen, onOpen, createEnvelopeBlast]);

  if (hidden) return null;

  return (
    <section
      id="opening"
      className={`opening${exiting ? ' exit' : ''}`}
      style={hidden ? { display: 'none' } : undefined}
    >
      <div className="petals" aria-hidden="true"></div>
      <div className="opening-ornament top">❀　❁　✿　❁　❀</div>

      <div className="opening-content">
        <div className="ganesha">ॐ</div>
        <p className="mantra">॥ శ్రీ గణేశాయ నమః ॥</p>
        <p className="invite-label">A BEAUTIFUL BEGINNING AWAITS</p>

        <button
          id="openEnvelope"
          className={`envelope-button${envelopeOpen ? ' open' : ''}`}
          aria-label="Open wedding invitation"
          onClick={handleClick}
        >
          <div className="letter">
            <div className="letter-border">
              <span className="letter-small">THE WEDDING OF</span>
              <strong>
                <span>B</span> <em>&hearts;</em> <span>M</span>
              </strong>
              <span className="letter-date">12 • 12 • 2026</span>
            </div>
          </div>

          <div className="envelope-body">
            <div className="envelope-flap"></div>

            {/* CSS blast */}
            <div className="blast" aria-hidden="true">
              {STATIC_BLAST.map((b, i) => (
                <span
                  key={i}
                  style={{
                    '--x': b.x,
                    '--y': b.y,
                    '--size': b.size,
                    '--color': b.color,
                    '--delay': b.delay,
                  }}
                >
                  {b.symbol}
                </span>
              ))}
            </div>

            {/* JS blast */}
            {jsBlastParticles.length > 0 && (
              <div className="js-blast" aria-hidden="true">
                {jsBlastParticles.map((p, i) => (
                  <span
                    key={i}
                    style={{
                      '--x': p.x,
                      '--y': p.y,
                      '--size': p.size,
                      '--duration': p.duration,
                      '--delay': p.delay,
                      '--rotation': p.rotation,
                      '--scale': p.scale,
                      color: p.color,
                    }}
                  >
                    {p.symbol}
                  </span>
                ))}
              </div>
            )}

            <div className="envelope-front">
              <div className="monogram">
                <span>B</span>
                <i>&hearts;</i>
                <span>M</span>
              </div>
              <div className="envelope-script">
                <h3>Bhuvan &hearts; Manasa</h3>
              </div>
            </div>
          </div>
        </button>

        <h1>You're Invited</h1>
        <br />
        <p className="tap-hint">Tap the envelope to open our invitation</p>
        <br />
        <br />
      </div>

      <div className="opening-ornament bottom">❀　❁　✿　❁　❀</div>
    </section>
  );
}

export default Opening;
