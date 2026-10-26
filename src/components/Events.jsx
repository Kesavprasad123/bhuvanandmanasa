import { useRef, useState, useEffect } from 'react';

const EVENTS = [
  {
    number: '01',
    title: 'Pelli Koduku',
    subtitle: 'Groom to be • A traditional beginning filled with blessings',
    image: '/assets/pellikoduku.webp',
    time: '9:00 AM',
    date: 'Date to be announced',
    venue: 'Venue to be announced',
  },
  {
    number: '02',
    title: 'Pelli Kuturu',
    subtitle: 'Bride to be • Mangalasnanam & auspicious rituals',
    image: '/assets/gallery/A25I9462.jpg',
    time: 'Time to be announced',
    date: 'Date to be announced',
    venue: 'Venue to be announced',
  },
  {
    number: '03',
    title: "Haldi (Groom's)",
    subtitle: 'Turmeric, laughter, yellow hues & family blessings',
    image: '/assets/haldi.png',
    time: 'Time to be announced',
    date: 'Date to be announced',
    venue: 'Venue to be announced',
  },
  {
    number: '04',
    title: "Haldi (Bride's)",
    subtitle: 'Golden radiance, flowers, music & celebration',
    image: '/assets/gallery/A25I8942.jpg',
    time: 'Time to be announced',
    date: 'Date to be announced',
    venue: 'Venue to be announced',
  },
  {
    number: '05',
    title: 'Sangeeth',
    subtitle: 'An evening of beats, dance, celebration & sparkle',
    image: '/assets/gallery/A25I8862.jpg',
    time: '7:00 PM onwards',
    date: 'Date to be announced',
    venue: 'Venue to be announced',
  },
  {
    number: '06',
    title: 'Mehandi',
    subtitle: 'Delicate henna swirls, joyous melodies & colours',
    image: '/assets/mehendi.webp',
    time: 'Time to be announced',
    date: 'Date to be announced',
    venue: 'Venue to be announced',
  },
  {
    number: '07',
    title: 'Marriage',
    subtitle: 'Two hearts, two families, one forever union',
    image: '/assets/wedding.webp',
    time: '8:24 PM (Muhurtham)',
    date: '12 December 2026',
    venue: 'SVPC CONVENTIONS',
  },
];

// Tripled events list for seamless, infinite wrap-around in both directions
const REPEATED_EVENTS = [...EVENTS, ...EVENTS, ...EVENTS].map((event, index) => ({
  ...event,
  uniqueKey: `${event.number}-${index}`,
  originalIndex: index % EVENTS.length,
}));

function Events() {
  const trackRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isAutoScrollOn, setIsAutoScrollOn] = useState(true);
  const pauseUntilRef = useRef(0);

  // Initialize track scroll position to middle set for two-way infinite scrolling
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const setWidth = el.scrollWidth / 3;
    el.scrollLeft = setWidth;
  }, []);

  // Continuous auto-scrolling with very minimal speed
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    let animId;
    // Minimal, tranquil speed: ~0.45px per frame (~27px per second)
    const SCROLL_SPEED = 0.45;

    const animate = () => {
      const now = Date.now();
      const isPaused = isHovered || !isAutoScrollOn || now < pauseUntilRef.current;

      if (!isPaused && el) {
        el.scrollLeft += SCROLL_SPEED;

        // Seamless infinite loop
        const oneSetWidth = el.scrollWidth / 3;
        if (el.scrollLeft >= oneSetWidth * 2) {
          el.scrollLeft -= oneSetWidth;
        } else if (el.scrollLeft <= 0) {
          el.scrollLeft += oneSetWidth;
        }

        // Determine currently focused card
        const cardWidth = el.firstElementChild?.clientWidth || 350;
        const gap = 24;
        const pitch = cardWidth + gap;
        const currentIdx = Math.floor((el.scrollLeft + el.clientWidth / 2) / pitch) % EVENTS.length;
        setActiveIndex(currentIdx);
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [isHovered, isAutoScrollOn]);

  const pauseTemporarily = (duration = 3500) => {
    pauseUntilRef.current = Date.now() + duration;
  };

  const scrollByDirection = (direction) => {
    const el = trackRef.current;
    if (!el) return;
    pauseTemporarily(4000);
    const scrollAmount = (el.firstElementChild?.clientWidth || 350) + 24;
    el.scrollBy({
      left: direction === 'next' ? scrollAmount : -scrollAmount,
      behavior: 'smooth',
    });
  };

  const scrollToOriginalIndex = (targetIndex) => {
    const el = trackRef.current;
    if (!el) return;
    pauseTemporarily(4000);

    const cardWidth = el.firstElementChild?.clientWidth || 350;
    const gap = 24;
    const pitch = cardWidth + gap;
    const oneSetWidth = el.scrollWidth / 3;

    // Scroll to the card in the middle section
    const targetScroll = oneSetWidth + targetIndex * pitch - (el.clientWidth - cardWidth) / 2;
    el.scrollTo({
      left: targetScroll,
      behavior: 'smooth',
    });
    setActiveIndex(targetIndex);
  };

  return (
    <section id="events" className="events-section section-cream">
      <div className="section-inner wide reveal">
        <p className="eyebrow">SAVE THE DATES</p>
        <h2>Wedding Festivities</h2>
        <p className="section-subtitle">
          Seven beautiful moments leading to a lifetime of togetherness.
        </p>

        <div className="event-carousel-wrapper">
          {/* Previous Arrow Button */}
          <button
            type="button"
            className="carousel-nav-btn prev"
            onClick={() => scrollByDirection('prev')}
            aria-label="Previous event"
          >
            &#8249;
          </button>

          {/* Continuous Horizontally Scrolling Track */}
          <div
            className="event-scroll-track"
            ref={trackRef}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onTouchStart={() => pauseTemporarily(5000)}
            onTouchEnd={() => pauseTemporarily(2000)}
          >
            {REPEATED_EVENTS.map((event) => (
              <article
                key={event.uniqueKey}
                className={`event-card ${event.originalIndex === activeIndex ? 'active-card' : ''}`}
                style={{ '--event-image': `url('${event.image}')` }}
                onClick={() => scrollToOriginalIndex(event.originalIndex)}
              >
                <div className="event-overlay"></div>
                <div className="event-content">
                  <span className="event-number">{event.number}</span>
                  <h3>{event.title}</h3>
                  <p className="event-subtitle">{event.subtitle}</p>
                  <div className="event-details">
                    <span>🕐 <b>{event.time}</b></span>
                    <span>📅 <b>{event.date}</b></span>
                    <span>📍 <b>{event.venue}</b></span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Next Arrow Button */}
          <button
            type="button"
            className="carousel-nav-btn next"
            onClick={() => scrollByDirection('next')}
            aria-label="Next event"
          >
            &#8250;
          </button>
        </div>

        {/* Carousel Dots & Controls */}
        <div className="carousel-indicators">
          {EVENTS.map((event, i) => (
            <button
              key={event.number}
              type="button"
              className={`carousel-dot ${i === activeIndex ? 'active' : ''}`}
              onClick={() => scrollToOriginalIndex(i)}
              aria-label={`Jump to ${event.title}`}
            >
              <span className="dot-num">{event.number}</span>
              <span className="dot-title">{event.title}</span>
            </button>
          ))}

          {/* Pause / Resume Auto-scroll Toggle */}
          <button
            type="button"
            className={`auto-scroll-toggle ${!isAutoScrollOn ? 'paused' : ''}`}
            onClick={() => setIsAutoScrollOn((prev) => !prev)}
            aria-label={isAutoScrollOn ? 'Pause auto-scrolling' : 'Resume auto-scrolling'}
            title={isAutoScrollOn ? 'Pause auto-scrolling' : 'Resume auto-scrolling'}
          >
            {isAutoScrollOn ? '⏸ Auto-scroll' : '▶ Auto-scroll'}
          </button>
        </div>

        <p className="scroll-hint">‹ Auto-scrolling at gentle speed • Hover or touch anytime to pause ›</p>
      </div>
    </section>
  );
}

export default Events;
