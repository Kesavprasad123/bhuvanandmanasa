import { useState, useEffect, useRef } from 'react';

const EVENTS = [
  {
    number: '01',
    title: 'Pelli Koduku',
    teluguTitle: 'పెళ్ళికొడుకు',
    subtitle: 'Groom to be • A traditional beginning filled with auspicious blessings',
    image: '/assets/pellikoduku.jpg',
    time: '9:00 AM',
    date: 'Date to be announced',
    venue: 'Venue to be announced',
    color: '#e69500',
  },
  {
    number: '02',
    title: 'Pelli Kuturu',
    teluguTitle: 'పెళ్ళికూతురు',
    subtitle: 'Bride to be • Mangalasnanam, floral radiant rites & family affection',
    image: '/assets/pellikuthuru.jpg',
    time: 'Time to be announced',
    date: 'Date to be announced',
    venue: 'Venue to be announced',
    color: '#d44368',
  },
  {
    number: '03',
    title: "Haldi (Groom's)",
    teluguTitle: "హల్దీ వేడుక (వరుడు)",
    subtitle: 'Turmeric showers, cheerful laughter, yellow hues & celebration',
    image: '/assets/haldi.jpg',
    time: 'Time to be announced',
    date: 'Date to be announced',
    venue: 'Venue to be announced',
    color: '#d99b00',
  },
  {
    number: '04',
    title: "Haldi (Bride's)",
    teluguTitle: "హల్దీ వేడుక (వధువు)",
    subtitle: 'Golden sunshine radiance, marigold petals, joy & laughter',
    image: '/assets/haldi_bride.jpg',
    time: 'Time to be announced',
    date: 'Date to be announced',
    venue: 'Venue to be announced',
    color: '#e28d00',
  },
  {
    number: '05',
    title: 'Sangeeth',
    teluguTitle: 'సంగీత్ సంబరం',
    subtitle: 'An enchanting starlit evening of beats, dance, sparkle & harmony',
    image: '/assets/sangeeth.jpg',
    time: '7:00 PM onwards',
    date: 'Date to be announced',
    venue: 'Venue to be announced',
    color: '#4954b0',
  },
  {
    number: '06',
    title: 'Mehandi',
    teluguTitle: 'మెహందీ వేడుక',
    subtitle: 'Delicate henna swirls, joyous songs & vibrant festive charm',
    image: '/assets/mehendi.webp',
    time: 'Time to be announced',
    date: 'Date to be announced',
    venue: 'Venue to be announced',
    color: '#3d8253',
  },
  {
    number: '07',
    title: 'Marriage',
    teluguTitle: 'కళ్యాణ మహోత్సవం',
    subtitle: 'Two hearts, sacred vows, seven pheras & an eternal journey together',
    image: '/assets/wedding.webp',
    time: '8:26 PM (Muhurtham)',
    date: '12 December 2026',
    venue: 'SVPC CONVENTIONS',
    color: '#8e3045',
  },
];

function Events() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartXRef = useRef(null);
  const touchEndXRef = useRef(null);
  const total = EVENTS.length;

  const goToNext = () => {
    setActiveIndex((prev) => (prev + 1) % total);
  };

  const goToPrev = () => {
    setActiveIndex((prev) => (prev - 1 + total) % total);
  };

  const goToIndex = (index) => {
    setActiveIndex(index);
  };

  // Gentle Autoplay Timer
  useEffect(() => {
    if (!isAutoPlay || isHovered) return;

    const timer = setInterval(() => {
      goToNext();
    }, 4500);

    return () => clearInterval(timer);
  }, [isAutoPlay, isHovered]);

  // Touch Swipe Handlers for mobile
  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchEndXRef.current = null;
  };

  const handleTouchMove = (e) => {
    touchEndXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current === null || touchEndXRef.current === null) return;
    const diff = touchStartXRef.current - touchEndXRef.current;
    const minSwipeDistance = 45;

    if (diff > minSwipeDistance) {
      goToNext();
    } else if (diff < -minSwipeDistance) {
      goToPrev();
    }

    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      goToPrev();
    } else if (e.key === 'ArrowRight') {
      goToNext();
    }
  };

  // Helper to determine position relative to active card
  const getCardPositionClass = (index) => {
    let diff = index - activeIndex;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;

    if (diff === 0) return 'is-active';
    if (diff === -1) return 'is-prev';
    if (diff === 1) return 'is-next';
    if (diff < -1) return 'is-hidden-left';
    return 'is-hidden-right';
  };

  return (
    <section
      id="events"
      className="events-section section-cream"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-label="Wedding Events Carousel"
    >
      <div className="section-inner wide reveal">
        <p className="eyebrow">SAVE THE DATES</p>
        <h2>Wedding Festivities</h2>
        <p className="section-subtitle">
          Seven sacred celebrations leading to a lifetime of togetherness.
        </p>

        {/* 3D Stage Container */}
        <div
          className="events-stage-wrapper"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Navigation Arrows */}
          <button
            type="button"
            className="stage-nav-btn prev"
            onClick={goToPrev}
            aria-label="Previous event"
          >
            &#8249;
          </button>

          <button
            type="button"
            className="stage-nav-btn next"
            onClick={goToNext}
            aria-label="Next event"
          >
            &#8250;
          </button>

          {/* 3D Stage: exactly 3 visible (center zoomed, left & right minimized) */}
          <div className="events-stage">
            {EVENTS.map((event, index) => {
              const positionClass = getCardPositionClass(index);
              const isActive = positionClass === 'is-active';
              const isPrev = positionClass === 'is-prev';
              const isNext = positionClass === 'is-next';

              return (
                <article
                  key={event.number}
                  className={`stage-card ${positionClass}`}
                  style={{ backgroundImage: `url('${event.image}')` }}
                  onClick={() => {
                    if (isPrev) goToPrev();
                    if (isNext) goToNext();
                  }}
                  role="button"
                  tabIndex={isActive ? 0 : -1}
                  aria-current={isActive ? 'true' : 'false'}
                  aria-label={`${event.title} - Event ${event.number}`}
                >
                  {/* Subtle top & bottom gradients for depth and text legibility */}
                  <div className="stage-card-overlay"></div>

                  {/* Top Badge: Number + Telugu title */}
                  <div className="stage-card-top">
                    <span className="stage-event-badge">
                      EVENT {event.number} / 07
                    </span>
                    <span className="stage-event-telugu">{event.teluguTitle}</span>
                  </div>

                  {/* Card Main Info */}
                  <div className="stage-card-content">
                    <h3 className="stage-card-title">{event.title}</h3>
                    <p className="stage-card-subtitle">{event.subtitle}</p>

                    <div className="stage-card-meta">
                      <div className="meta-item">
                        <span className="meta-icon" aria-hidden="true">🕒</span>
                        <div className="meta-text">
                          <small>TIME</small>
                          <strong>{event.time}</strong>
                        </div>
                      </div>

                      <div className="meta-item">
                        <span className="meta-icon" aria-hidden="true">📅</span>
                        <div className="meta-text">
                          <small>DATE</small>
                          <strong>{event.date}</strong>
                        </div>
                      </div>

                      <div className="meta-item venue-meta">
                        <span className="meta-icon" aria-hidden="true">📍</span>
                        <div className="meta-text">
                          <small>VENUE</small>
                          <strong>{event.venue}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Interactive click-hint for side cards */}
                  {!isActive && (
                    <div className="side-card-hint">
                      <span>{isPrev ? '‹ View' : 'View ›'}</span>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>

        {/* Carousel Stepper / Indicators */}
        <div className="stage-indicators">
          {EVENTS.map((event, i) => (
            <button
              key={event.number}
              type="button"
              className={`stage-dot ${i === activeIndex ? 'active' : ''}`}
              onClick={() => goToIndex(i)}
              aria-label={`Jump to ${event.title}`}
            >
              <span className="dot-index">{event.number}</span>
              <span className="dot-name">{event.title}</span>
            </button>
          ))}

          {/* Autoplay Toggle */}
          <button
            type="button"
            className={`stage-autoplay-toggle ${!isAutoPlay ? 'paused' : ''}`}
            onClick={() => setIsAutoPlay((prev) => !prev)}
            aria-label={isAutoPlay ? 'Pause auto-play' : 'Resume auto-play'}
            title={isAutoPlay ? 'Pause auto-play' : 'Resume auto-play'}
          >
            {isAutoPlay ? '⏸ Auto-play' : '▶ Auto-play'}
          </button>
        </div>

        <p className="stage-hint">
          ‹ Swipe or click side cards to explore • Hover to pause ›
        </p>
      </div>
    </section>
  );
}

export default Events;
