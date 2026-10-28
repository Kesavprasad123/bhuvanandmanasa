import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  HOW TO ADD YOUR GOOGLE MAPS LINKS & COORDINATES               ║
 * ║                                                                ║
 * ║  For each event below, update these two fields:                ║
 * ║                                                                ║
 * ║  1. mapUrl  → paste the full Google Maps link for the venue    ║
 * ║     Example: 'https://maps.google.com/?q=17.3850,78.4867'     ║
 * ║                                                                ║
 * ║  2. coordinates → { lat: <latitude>, lng: <longitude> }       ║
 * ║     Example: { lat: 17.3850, lng: 78.4867 }                   ║
 * ║                                                                ║
 * ║  You can get lat/lng from Google Maps by right-clicking a      ║
 * ║  location and selecting the coordinates.                       ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

const EVENTS = [
  {
    number: '01',
    title: 'Pelli Koduku',
    teluguTitle: 'పెళ్ళికొడుకు',
    subtitle: 'Groom to be • A traditional beginning filled with auspicious blessings',
    image: '/assets/pellikoduku.webp',
    time: '09:00 AM',
    date: '10-12-2026',
    venue: 'Vihari Nivas - Rajamahendravaram',
    color: '#e69500',
    mapUrl: 'https://maps.app.goo.gl/DNF4svxa2FNRN3o27?g_st=iw',
    coordinates: { lat: 17.0253368, lng: 81.7834292 },
  },
  {
    number: '02',
    title: 'Pelli Kuturu',
    teluguTitle: 'పెళ్ళికూతురు',
    subtitle: 'Bride to be • Mangalasnanam, floral radiant rites & family affection',
    image: '/assets/pellikuthuru.webp',
    time: '09:00 AM',
    date: '10-12-2026',
    venue: 'Avinya Banquet & Suits',
    color: '#d44368',
    mapUrl: 'https://maps.app.goo.gl/rdH9ZzYK1vsZ3sDB8?g_st=iw',
    coordinates: { lat: 17.0082807, lng: 81.8058498 },
  },
  {
    number: '03',
    title: "Haldi (Groom's)",
    teluguTitle: "హల్దీ వేడుక (వరుడు)",
    subtitle: 'Turmeric showers, cheerful laughter, yellow hues & celebration',
    image: '/assets/haldi.webp',
    time: '03:00 PM',
    date: '10-12-2026',
    venue: 'Vihari Nivas - Rajamahendravaram',
    color: '#d99b00',
    mapUrl: 'https://maps.app.goo.gl/DNF4svxa2FNRN3o27?g_st=iw',
    coordinates: { lat: 17.0253368, lng: 81.7834292 },
  },
  {
    number: '04',
    title: "Haldi (Bride's)",
    teluguTitle: "హల్దీ వేడుక (వధువు)",
    subtitle: 'Golden sunshine radiance, marigold petals, joy & laughter',
    image: '/assets/haldi_bride.webp',
    time: '03:30 PM',
    date: '10-12-2026',
    venue: 'Avinya Banquet & Suits',
    color: '#e28d00',
    mapUrl: 'https://maps.app.goo.gl/rdH9ZzYK1vsZ3sDB8?g_st=iw',
    coordinates: { lat: 17.0082807, lng: 81.8058498 },
  },
  {
    number: '05',
    title: 'Sangeeth',
    teluguTitle: 'సంగీత్ సంబరం',
    subtitle: 'An enchanting starlit evening of beats, dance, sparkle & harmony',
    image: '/assets/sangeeth.webp',
    time: '7:00 PM onwards',
    date: '11-12-2026',
    venue: 'Avinya Banquet & Suits',
    color: '#4954b0',
    mapUrl: 'https://maps.app.goo.gl/rdH9ZzYK1vsZ3sDB8?g_st=iw',
    coordinates: { lat: 17.0082807, lng: 81.8058498 },
  },
  {
    number: '06',
    title: 'Mehandi',
    teluguTitle: 'మెహందీ వేడుక',
    subtitle: 'Delicate henna swirls, joyous songs & vibrant festive charm',
    image: '/assets/mehendi.webp',
    time: '5:00 PM onwards',
    date: '11-12-2026',
    venue: 'Avinya Banquet & Suits',
    color: '#3d8253',
    mapUrl: 'https://maps.app.goo.gl/rdH9ZzYK1vsZ3sDB8?g_st=iw',
    coordinates: { lat: 17.0082807, lng: 81.8058498 },
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
    mapUrl: 'https://maps.app.goo.gl/s6EFpBAJ4UScq46k6?g_st=iw',
    coordinates: { lat: 17.0387557, lng: 81.8332866 },
  },
];

/* Haversine formula — calculates distance (km) between two lat/lng points */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function Events() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [flippedCards, setFlippedCards] = useState({});
  const [userLocation, setUserLocation] = useState(null);
  const touchStartXRef = useRef(null);
  const touchEndXRef = useRef(null);
  const total = EVENTS.length;

  const goToNext = useCallback(() => {
    setFlippedCards({});
    setActiveIndex((prev) => (prev + 1) % total);
  }, [total]);

  const goToPrev = useCallback(() => {
    setFlippedCards({});
    setActiveIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Continuous auto-scroll (pauses on hover or when card is flipped)
  useEffect(() => {
    const isAnyCardFlipped = Object.values(flippedCards).some(Boolean);
    if (isHovered || isAnyCardFlipped) return;

    const timer = setInterval(() => {
      goToNext();
    }, 5000); // gentle 5-second interval

    return () => clearInterval(timer);
  }, [isHovered, flippedCards, goToNext]);

  // Get user's geolocation for distance calculation
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          // Silently fail — distance just won't show
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
      );
    }
  }, []);

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

  // Card position helper
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

  // Toggle flip for a card
  const toggleFlip = (index, e) => {
    e.stopPropagation();
    setFlippedCards((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  // Calculate distance from user to venue
  const getDistance = (eventCoords) => {
    if (!userLocation || !eventCoords) return null;
    const dist = haversineDistance(
      userLocation.lat,
      userLocation.lng,
      eventCoords.lat,
      eventCoords.lng
    );
    return dist < 1 ? `${(dist * 1000).toFixed(0)} m` : `${dist.toFixed(1)} km`;
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

          {/* 3D Stage */}
          <div className="events-stage">
            {EVENTS.map((event, index) => {
              const positionClass = getCardPositionClass(index);
              const isActive = positionClass === 'is-active';
              const isPrev = positionClass === 'is-prev';
              const isNext = positionClass === 'is-next';
              const isFlipped = !!flippedCards[index];
              const distance = getDistance(event.coordinates);

              return (
                <article
                  key={event.number}
                  className={`stage-card ${positionClass} ${isFlipped ? 'is-flipped' : ''}`}
                  onClick={() => {
                    if (isPrev) goToPrev();
                    if (isNext) goToNext();
                  }}
                  role="button"
                  tabIndex={isActive ? 0 : -1}
                  aria-current={isActive ? 'true' : 'false'}
                  aria-label={`${event.title} - Event ${event.number}`}
                >
                  {/* ===== FRONT FACE ===== */}
                  <div
                    className="card-face card-front"
                    style={{ backgroundImage: `url('${event.image}')` }}
                  >
                    {/* Gradient overlay */}
                    <div className="stage-card-overlay"></div>

                    {/* Top Badge */}
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

                    {/* Flip trigger arrow at the bottom of front face */}
                    {isActive && (
                      <button
                        type="button"
                        className="flip-trigger-btn"
                        onClick={(e) => toggleFlip(index, e)}
                        aria-label="View venue location on map"
                        title="View location on map"
                      >
                        <span className="flip-arrow-icon">📍</span>
                        <span className="flip-arrow-text">View Map</span>
                        <span className="flip-arrow-chevron">↻</span>
                      </button>
                    )}
                  </div>

                  {/* ===== BACK FACE ===== */}
                  <div className="card-face card-back">
                    <div className="card-back-inner">
                      {/* Back header */}
                      <div className="back-header">
                        <span className="back-event-badge">
                          EVENT {event.number} / 07
                        </span>
                        <h3 className="back-title">{event.title}</h3>
                        <p className="back-venue">{event.venue}</p>
                      </div>

                      {/* Map section */}
                      <div className="back-map-container">
                        {event.coordinates ? (
                          <iframe
                            title={`${event.title} location`}
                            className="back-map-iframe"
                            src={`https://maps.google.com/maps?q=${event.coordinates.lat},${event.coordinates.lng}&z=15&output=embed`}
                            loading="lazy"
                            allowFullScreen
                          ></iframe>
                        ) : event.venue && event.venue !== 'Venue to be announced' ? (
                          <iframe
                            title={`${event.title} location`}
                            className="back-map-iframe"
                            src={`https://maps.google.com/maps?q=${encodeURIComponent(event.venue)}&z=15&output=embed`}
                            loading="lazy"
                            allowFullScreen
                          ></iframe>
                        ) : (
                          <div className="back-map-placeholder">
                            <span className="map-placeholder-icon">🗺️</span>
                            <p>Location will be updated soon</p>
                          </div>
                        )}
                      </div>

                      {/* Distance from user */}
                      {distance && (
                        <div className="back-distance">
                          <span className="distance-icon">🧭</span>
                          <span className="distance-text">
                            <strong>{distance}</strong> from your location
                          </span>
                        </div>
                      )}

                      {/* Navigate button */}
                      {event.mapUrl ? (
                        <a
                          href={event.mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="back-navigate-btn"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span>📍 Navigate to Venue</span>
                        </a>
                      ) : (
                        <div className="back-navigate-btn disabled">
                          <span>📍 Directions coming soon</span>
                        </div>
                      )}

                      {/* Flip back button */}
                      <button
                        type="button"
                        className="flip-back-btn"
                        onClick={(e) => toggleFlip(index, e)}
                        aria-label="Flip back to event details"
                      >
                        ↻ Back to Event
                      </button>
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
      </div>
    </section>
  );
}

export default Events;
