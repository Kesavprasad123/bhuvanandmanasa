import { useCallback, useEffect, useState } from 'react';
import { CHECK_IN_TIME, CHECK_OUT_TIME, PROPERTIES, getProperty } from '../data/accommodation';
import {
  bookingConfigured,
  fetchAvailability,
  isHostLoggedIn,
  logoutHost,
  restoreHostSession,
  subscribeToDatabaseChanges,
} from '../data/bookingStore';
import { HostLoginDialog, RoomStatusLight } from './BookingControls';
import HostDashboard from './HostDashboard';
import MusicToggle from './MusicToggle';
import useScrollReveal from '../hooks/useScrollReveal';
import useWeddingMusic from '../hooks/useWeddingMusic';
import '../styles/accommodation.css';
import '../styles/booking.css';

/** Property id encoded in the URL hash (e.g. /accommodation#svpc), if valid. */
function propertyFromHash() {
  const id = window.location.hash.replace(/^#/, '');
  return getProperty(id) ? id : PROPERTIES[0].id;
}

/* ---------- decorative floral divider ---------- */
function Ornament({ className = '' }) {
  return (
    <svg className={`acc-ornament ${className}`} viewBox="0 0 260 26" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round">
        <path d="M6 13 H92" />
        <path d="M168 13 H254" />
        <path d="M96 13 q8-7 16 0 q-8 7-16 0" />
        <path d="M164 13 q-8-7-16 0 q8 7 16 0" />
      </g>
      <g fill="currentColor">
        <circle cx="130" cy="6.5" r="3.4" />
        <circle cx="130" cy="19.5" r="3.4" />
        <circle cx="123" cy="13" r="3.4" />
        <circle cx="137" cy="13" r="3.4" />
        <circle cx="130" cy="13" r="2.6" fill="var(--paper)" />
      </g>
    </svg>
  );
}

/* ---------- hand-drawn property artwork ---------- */
function StayArt({ variant, uid }) {
  const bgId = `acc-art-bg-${variant}-${uid}`;
  const glowId = `acc-art-glow-${variant}-${uid}`;
  const gold = '#e9cf9d';
  const soft = 'rgba(255, 248, 236, .78)';

  if (variant === 'svpc') {
    return (
      <svg className="acc-art" viewBox="0 0 400 210" role="img" aria-label="Illustration of the SVPC stay">
        <defs>
          <linearGradient id={bgId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4c5b47" />
            <stop offset="100%" stopColor="#2f3b30" />
          </linearGradient>
          <radialGradient id={glowId} cx="50%" cy="35%" r="70%">
            <stop offset="0%" stopColor="rgba(233,207,157,.35)" />
            <stop offset="100%" stopColor="rgba(233,207,157,0)" />
          </radialGradient>
        </defs>
        <rect width="400" height="210" fill={`url(#${bgId})`} />
        <rect width="400" height="210" fill={`url(#${glowId})`} />
        <g stroke={gold} strokeWidth="2" fill="none" strokeLinecap="round">
          {/* façade */}
          <path d="M70 170 V86 h260 v84" />
          <path d="M56 86 h288" />
          <path d="M64 70 h272 l-14 -16 H78 Z" />
          {/* columns */}
          <path d="M104 170 V96 M148 170 V96 M252 170 V96 M296 170 V96" />
          {/* entrance */}
          <path d="M170 170 v-42 a30 30 0 0 160 0 v42" />
          <path d="M200 170 v-58" strokeOpacity=".55" />
          {/* windows */}
          <path d="M116 122 v-12 a12 12 0 0 124 0 v12 Z" />
          <path d="M260 122 v-12 a12 12 0 0 124 0 v12 Z" />
          {/* steps */}
          <path d="M52 170 h296 M64 182 h272 M78 194 h244" strokeOpacity=".75" />
          {/* lamp posts */}
          <path d="M40 194 V120 M360 194 V120" strokeOpacity=".7" />
          <circle cx="40" cy="112" r="7" fill={gold} stroke="none" />
          <circle cx="360" cy="112" r="7" fill={gold} stroke="none" />
        </g>
        {/* festive toran string */}
        <g fill={gold} opacity=".9">
          <path d="M76 60 q124 34 248 0 l0 6 q-124 32 -248 0 Z" opacity=".55" />
          <circle cx="108" cy="68" r="3.5" />
          <circle cx="152" cy="76" r="3.5" />
          <circle cx="200" cy="79" r="4" />
          <circle cx="248" cy="76" r="3.5" />
          <circle cx="292" cy="68" r="3.5" />
        </g>
        <g fill={soft} opacity=".65">
          <circle cx="200" cy="34" r="3" />
          <circle cx="176" cy="44" r="2.2" />
          <circle cx="224" cy="44" r="2.2" />
        </g>
      </svg>
    );
  }

  return (
    <svg className="acc-art" viewBox="0 0 400 210" role="img" aria-label="Illustration of Krishna Inn">
      <defs>
        <linearGradient id={bgId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7d2c40" />
          <stop offset="100%" stopColor="#541d2d" />
        </linearGradient>
        <radialGradient id={glowId} cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor="rgba(240,214,164,.34)" />
          <stop offset="100%" stopColor="rgba(240,214,164,0)" />
        </radialGradient>
      </defs>
      <rect width="400" height="210" fill={`url(#${bgId})`} />
      <rect width="400" height="210" fill={`url(#${glowId})`} />
      <g stroke={gold} strokeWidth="2" fill="none" strokeLinecap="round">
        {/* haveli block */}
        <path d="M96 174 V78 h208 v96" />
        <path d="M84 78 h232" />
        {/* central dome + finial */}
        <path d="M174 60 q26 -34 52 0 Z" />
        <path d="M200 43 v-7" />
        {/* side chhatris */}
        <path d="M120 78 q14 -22 28 0" />
        <path d="M252 78 q14 -22 28 0" />
        {/* arched doorway */}
        <path d="M174 174 v-44 a26 26 0 0 152 0 v44" />
        <path d="M200 174 v-66" strokeOpacity=".5" />
        {/* jharokha windows */}
        <path d="M114 132 v-16 a14 14 0 0 128 0 v16 Z" />
        <path d="M258 132 v-16 a14 14 0 0 128 0 v16 Z" />
        <path d="M128 132 v-30 M272 132 v-30" strokeOpacity=".55" />
        {/* balcony line */}
        <path d="M84 174 h232 M74 188 h252" strokeOpacity=".75" />
        {/* hanging lamps */}
        <path d="M150 78 v18 M250 78 v18" strokeOpacity=".7" />
        <circle cx="150" cy="102" r="7" fill={gold} stroke="none" />
        <circle cx="250" cy="102" r="7" fill={gold} stroke="none" />
        {/* side arches */}
        <path d="M46 174 v-40 a22 22 0 0 144 0 v40" strokeOpacity=".55" />
        <path d="M310 174 v-40 a22 22 0 0 144 0 v40" strokeOpacity=".55" />
      </g>
      <g fill={gold} opacity=".85">
        <path d="M200 22 l6.5 7 -6.5 7 -6.5 -7 Z" />
        <circle cx="200" cy="146" r="3.4" />
        <circle cx="144" cy="62" r="3" />
        <circle cx="256" cy="62" r="3" />
      </g>
      <g fill={soft} opacity=".6">
        <circle cx="60" cy="52" r="2.6" />
        <circle cx="340" cy="46" r="2.6" />
        <circle cx="366" cy="92" r="2" />
        <circle cx="34" cy="104" r="2" />
      </g>
    </svg>
  );
}

/** Resolves the root wedding invitation URL from the current window location. */
export function getHomeHref() {
  if (typeof window === 'undefined') return '/';
  const pathname = window.location.pathname || '';
  const parent = pathname.replace(/\/accommodation(?:\/.*)?$/i, '');
  if (!parent || parent === '') return '/';
  return parent.endsWith('/') ? parent : `${parent}/`;
}

const getStoredTheme = () => {
  try {
    return localStorage.getItem('weddingTheme') === 'dark';
  } catch {
    return false;
  }
};

function Accommodation({
  musicPlaying: externalMusicPlaying,
  onToggleMusic: externalToggleMusic,
  isDark: externalIsDark,
  onToggleTheme: externalToggleTheme,
  onBackToInvitation,
} = {}) {
  const [homeHref, setHomeHref] = useState(getHomeHref);
  const [internalDark, setInternalDark] = useState(getStoredTheme);
  const [selectedId, setSelectedId] = useState(propertyFromHash);

  const isDark = externalIsDark !== undefined ? externalIsDark : internalDark;
  const toggleTheme =
    externalToggleTheme ||
    (() => {
      setInternalDark((prev) => {
        const next = !prev;
        try {
          localStorage.setItem('weddingTheme', next ? 'dark' : 'light');
        } catch {}
        return next;
      });
    });

  // Background music handover: if parent provides external controls, use them!
  const localMusic = useWeddingMusic({ autoStartIfActive: !externalToggleMusic });
  const musicPlaying = externalMusicPlaying !== undefined ? externalMusicPlaying : localMusic.musicPlaying;
  const toggleMusic = externalToggleMusic || localMusic.toggleMusic;
  const audioRef = localMusic.audioRef;

  useEffect(() => {
    setHomeHref(getHomeHref());
  }, []);

  const handleBackToInvitation = useCallback(
    (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      if (onBackToInvitation) {
        onBackToInvitation();
      } else {
        const audio = audioRef.current;
        if (audio && !audio.paused) {
          try {
            sessionStorage.setItem('weddingMusicActive', 'true');
            sessionStorage.setItem('weddingSongTime', String(audio.currentTime || 0));
          } catch {}
        }
        const target = getHomeHref();
        window.location.assign(target);
      }
    },
    [onBackToInvitation, audioRef]
  );

  // Availability state
  const [availability, setAvailability] = useState(null);
  const [availabilityError, setAvailabilityError] = useState('');

  // Host session
  const [showLogin, setShowLogin] = useState(false);
  const [hostLoggedIn, setHostLoggedIn] = useState(isHostLoggedIn);
  const [dashboardOpen, setDashboardOpen] = useState(false);

  const selectedProperty = getProperty(selectedId) || PROPERTIES[0];
  const viewKey = dashboardOpen ? 'dashboard' : selectedId || 'overview';

  const availabilityState = !bookingConfigured
    ? 'off'
    : availability
      ? 'ready'
      : availabilityError
        ? 'error'
        : 'loading';

  useScrollReveal(viewKey);

  useEffect(() => {
    document.body.classList.remove('locked');
    document.body.classList.toggle('dark-theme', isDark);
  }, [isDark]);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Wedding Accommodation | Bhuvan & Manasa';

    const robots = document.createElement('meta');
    robots.setAttribute('name', 'robots');
    robots.setAttribute('content', 'noindex, nofollow');
    document.head.appendChild(robots);

    window.scrollTo(0, 0);

    return () => {
      document.title = previousTitle;
      robots.remove();
    };
  }, []);

  // Sync hash
  useEffect(() => {
    const syncFromHash = () => setSelectedId(propertyFromHash());
    window.addEventListener('popstate', syncFromHash);
    return () => window.removeEventListener('popstate', syncFromHash);
  }, []);

  const loadAvailability = useCallback(async () => {
    if (!bookingConfigured) return;
    try {
      const map = await fetchAvailability();
      setAvailability(map);
      setAvailabilityError('');
    } catch (error) {
      setAvailabilityError((error && error.message) || 'Room availability is temporarily unavailable.');
    }
  }, []);

  useEffect(() => {
    loadAvailability();
    const unsub = subscribeToDatabaseChanges(() => {
      loadAvailability();
    });
    const timer = setInterval(loadAvailability, 15000);
    return () => {
      unsub();
      clearInterval(timer);
    };
  }, [loadAvailability]);

  // Restore host session
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await restoreHostSession();
      if (!cancelled && token) {
        setHostLoggedIn(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const countsFor = useCallback(
    (property) => {
      const total = property.rooms.length;
      if (availabilityState !== 'ready') return { total, booked: null, available: null };
      const map = availability ? availability[property.id] || {} : {};
      const booked = property.rooms.filter((room) => map[room]).length;
      return { total, booked, available: total - booked };
    },
    [availability, availabilityState]
  );

  const handleSelectLocation = (id) => {
    if (window.location.hash !== `#${id}`) {
      window.history.pushState(null, '', `#${id}`);
    }
    setSelectedId(id);
  };

  const handleLoginSuccess = () => {
    setShowLogin(false);
    setHostLoggedIn(true);
    setDashboardOpen(true);
    loadAvailability();
  };

  const handleLogout = async () => {
    await logoutHost();
    setHostLoggedIn(false);
    setDashboardOpen(false);
  };

  const handleSessionExpired = () => {
    setHostLoggedIn(false);
    setDashboardOpen(false);
    setShowLogin(true);
  };

  return (
    <div className="acc-page">
      {!externalToggleMusic && (
        <audio
          ref={audioRef}
          onEnded={localMusic.handleSongEnded}
          onError={localMusic.handleAudioError}
          preload="none"
        />
      )}
      <MusicToggle playing={musicPlaying} onToggle={toggleMusic} />

      {/* Top Bar Navigation */}
      <header className="acc-topbar">
        <a className="acc-home-link" href={homeHref} onClick={handleBackToInvitation}>
          ← Invitation
        </a>

        <div className="acc-topbar-actions">
          {bookingConfigured && !hostLoggedIn && (
            <button
              type="button"
              className="acc-host-link"
              onClick={() => setShowLogin(true)}
              title="Host access for room allocation tracking"
            >
              🔒 Host Login
            </button>
          )}

          {hostLoggedIn && !dashboardOpen && (
            <button
              type="button"
              className="acc-host-link is-active-mode"
              onClick={() => setDashboardOpen(true)}
            >
              👑 Host Dashboard
            </button>
          )}

          {hostLoggedIn && dashboardOpen && (
            <button
              type="button"
              className="acc-host-link"
              onClick={() => setDashboardOpen(false)}
            >
              👁️ Guest View
            </button>
          )}

          {hostLoggedIn && (
            <button
              type="button"
              className="acc-host-link is-logout"
              onClick={handleLogout}
            >
              Logout
            </button>
          )}

          <button
            className="theme-toggle"
            type="button"
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            aria-pressed={String(isDark)}
            onClick={toggleTheme}
          >
            {isDark ? '☀' : '☾'}
          </button>
        </div>
      </header>

      <main className="acc-main">
        {/* Hero Section */}
        <section className="acc-hero">
          <p className="eyebrow">BHUVAN &amp; MANASA · 12 DECEMBER 2026</p>
          <h1>Wedding Accommodation</h1>
          <p className="acc-subtitle">
            Comfortable stay arranged for our beloved family and guests.
          </p>
          <Ornament />
        </section>

        {/* HOST DASHBOARD VIEW */}
        {dashboardOpen && hostLoggedIn ? (
          <HostDashboard
            availability={availability}
            availabilityState={availabilityState}
            onAvailabilityRefresh={loadAvailability}
            onExit={() => setDashboardOpen(false)}
            onLogout={handleLogout}
            onSessionExpired={handleSessionExpired}
          />
        ) : (
          /* PUBLIC GUEST VIEW */
          <section className="acc-public-view">
            {/* Location Switcher Tabs */}
            <div className="acc-location-selector reveal">
              <span className="acc-selector-title">Select Stay Location:</span>
              <div className="acc-location-tabs" role="tablist">
                {PROPERTIES.map((property) => {
                  const counts = countsFor(property);
                  const isSelected = selectedProperty.id === property.id;
                  return (
                    <button
                      key={property.id}
                      type="button"
                      role="tab"
                      aria-selected={isSelected}
                      className={`acc-location-tab${isSelected ? ' is-selected' : ''}`}
                      onClick={() => handleSelectLocation(property.id)}
                    >
                      <span className="acc-loc-tab-name">{property.name}</span>
                      <span className="acc-loc-tab-meta">
                        {counts.available !== null ? `${counts.available} available` : '8 rooms'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Property Detail Card */}
            <div className="acc-venue-card reveal">
              <div className="acc-venue-art">
                <StayArt variant={selectedProperty.id} uid="guest-view" />
              </div>

              <div className="acc-venue-content">
                <div className="acc-venue-header">
                  <span className="acc-card-eyebrow">{selectedProperty.tagline}</span>
                  <h2 className="acc-venue-title">{selectedProperty.name}</h2>
                  <p className="acc-venue-blurb">{selectedProperty.blurb}</p>
                  {selectedProperty.address && (
                    <p className="acc-venue-address">📍 {selectedProperty.address}</p>
                  )}
                </div>

                {/* Timings & Map Action */}
                <div className="acc-venue-actions-row">
                  <div className="acc-timings-badge-wrap">
                    <span className="acc-time-badge">
                      🕒 Check-in: <strong>{CHECK_IN_TIME}</strong>
                    </span>
                    <span className="acc-time-badge">
                      🕚 Check-out: <strong>{CHECK_OUT_TIME}</strong>
                    </span>
                  </div>

                  {selectedProperty.mapUrl && (
                    <a
                      className="gold-button acc-map-btn"
                      target="_blank"
                      rel="noopener noreferrer"
                      href={selectedProperty.mapUrl}
                    >
                      📍 Open in Google Maps
                    </a>
                  )}
                </div>

                {/* Live Count Badges */}
                {(() => {
                  const counts = countsFor(selectedProperty);
                  return (
                    <ul className="acc-chips">
                      <li className="acc-chip">
                        <span className="acc-chip-label">Total Rooms</span>
                        <strong>{counts.total}</strong>
                      </li>
                      <li className="acc-chip is-booked">
                        <span className="acc-chip-label">Occupied</span>
                        <strong>{counts.booked === null ? '—' : counts.booked}</strong>
                      </li>
                      <li className="acc-chip is-free">
                        <span className="acc-chip-label">Available</span>
                        <strong>{counts.available === null ? '—' : counts.available}</strong>
                      </li>
                    </ul>
                  );
                })()}
              </div>
            </div>

            {/* Room Availability Grid (Privacy-Preserving) */}
            <div className="acc-panel reveal">
              <div className="acc-panel-head">
                <h3 className="acc-panel-title">Room Availability · {selectedProperty.name}</h3>
                <span className="acc-privacy-pill">🔒 Guest Details Private</span>
              </div>

              <div className="acc-public-rooms-grid">
                {selectedProperty.rooms.map((room) => {
                  const isBooked = Boolean(
                    availability &&
                    availability[selectedProperty.id] &&
                    availability[selectedProperty.id][room]
                  );

                  return (
                    <div
                      key={room}
                      className={`acc-public-room-tile${isBooked ? ' is-occupied' : ' is-available'}`}
                    >
                      <div className="acc-tile-room-header">
                        <span className="acc-tile-room-num">Room {room}</span>
                        <RoomStatusLight
                          loaded={availabilityState === 'ready'}
                          unavailable={availabilityState === 'error'}
                          booked={isBooked}
                        />
                      </div>
                      <div className="acc-tile-timings">
                        <span>Check-in {CHECK_IN_TIME}</span>
                        <span>Check-out {CHECK_OUT_TIME}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {availabilityError && (
                <p className="acc-status-error" role="status">
                  {availabilityError}
                </p>
              )}
            </div>

            {/* Privacy & Host Note */}
            <div className="acc-guest-footer-note reveal">
              <p>
                Guest allocations and names are kept private for security. For queries, room assistance,
                or early check-in, please contact the wedding coordinators directly.
              </p>
              {!hostLoggedIn && (
                <button
                  type="button"
                  className="acc-host-login-prompt"
                  onClick={() => setShowLogin(true)}
                >
                  Are you the wedding host? Tap here to manage allocations →
                </button>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Host Login Dialog */}
      <HostLoginDialog
        open={showLogin}
        onClose={() => setShowLogin(false)}
        onSuccess={handleLoginSuccess}
      />

      <footer className="acc-footer">
        <Ornament />
        <p>Bhuvan &amp; Manasa · 12 December 2026</p>
        <a className="acc-footer-link" href={homeHref} onClick={handleBackToInvitation}>
          ← Back to the wedding invitation
        </a>
      </footer>
    </div>
  );
}

export default Accommodation;
