import { useCallback, useEffect, useState } from 'react';
import { PROPERTIES, getProperty } from '../data/accommodation';
import {
  bookingConfigured,
  fetchAvailability,
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
  return getProperty(id) ? id : null;
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

/* ---------- traditional floral corner vine ---------- */
function FloralVine() {
  return (
    <svg className="acc-vine" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
        <path d="M118 6 C86 10 62 26 48 54 C40 70 36 90 38 114" />
        <path d="M74 30 q12 6 14 20" />
        <path d="M56 60 q-14 2-20 14" />
        <path d="M46 86 q12 4 16 16" />
      </g>
      <g fill="currentColor" opacity=".9">
        <ellipse cx="88" cy="26" rx="7" ry="4" transform="rotate(-24 88 26)" />
        <ellipse cx="40" cy="76" rx="7" ry="4" transform="rotate(28 40 76)" />
        <ellipse cx="62" cy="104" rx="7" ry="4" transform="rotate(-16 62 104)" />
        <circle cx="52" cy="44" r="3.2" />
        <circle cx="44" cy="100" r="3.2" />
      </g>
    </svg>
  );
}

/* ---------- hand-drawn property artwork (no external images) ---------- */
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
        {/* central dome + finial (kalash-style) */}
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
        {/* balcony line + ground */}
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

/** Total / booked / available summary chips (no private data). */
function SummaryChips({ counts }) {
  return (
    <ul className="acc-chips">
      <li className="acc-chip">
        <span className="acc-chip-label">Total Rooms</span>
        <strong>{counts.total}</strong>
      </li>
      <li className="acc-chip is-booked">
        <span className="acc-chip-label">Booked</span>
        <strong>{counts.booked === null ? '—' : counts.booked}</strong>
      </li>
      <li className="acc-chip is-free">
        <span className="acc-chip-label">Available</span>
        <strong>{counts.available === null ? '—' : counts.available}</strong>
      </li>
    </ul>
  );
}

/** Public room list: room number + red/green status only, never guest data. */
function AvailabilityTable({ property, availabilityState, availability }) {
  const loaded = availabilityState === 'ready';
  const unavailable = availabilityState !== 'ready' && availabilityState !== 'loading';
  const map = availability ? availability[property.id] : null;

  return (
    <>
      <p className="acc-result-count">Room availability</p>
      <div className="acc-table-wrap">
        <table className="acc-table">
          <caption className="acc-sr-only">Room availability at {property.name}</caption>
          <thead>
            <tr>
              <th scope="col">Room</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {property.rooms.map((room) => (
              <tr key={room}>
                <td data-label="Room" className="acc-room-cell">
                  <span className="acc-room-badge">{room}</span>
                </td>
                <td data-label="Status">
                  <RoomStatusLight loaded={loaded} unavailable={unavailable} booked={Boolean(map && map[room])} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/**
 * Resolves the root wedding invitation URL from the current window location.
 * Examples:
 * - Domain root: /accommodation/ -> /
 * - Domain root: /accommodation -> /
 * - GitHub Pages subpath: /bhuvanmanasa/accommodation/ -> /bhuvanmanasa/
 * - Dev server: http://localhost:5173/accommodation/ -> /
 */
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

function Accommodation() {
  const [homeHref, setHomeHref] = useState(getHomeHref);
  const [isDark, setIsDark] = useState(getStoredTheme);
  const [selectedId, setSelectedId] = useState(propertyFromHash);

  const {
    audioRef,
    musicPlaying,
    toggleMusic,
    handleSongEnded,
    handleAudioError,
  } = useWeddingMusic({ autoStartIfActive: true });

  useEffect(() => {
    setHomeHref(getHomeHref());
  }, []);

  const handleBackToInvitation = useCallback((e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    const audio = audioRef.current;
    if (audio && !audio.paused) {
      try {
        sessionStorage.setItem('weddingMusicActive', 'true');
        sessionStorage.setItem('weddingSongTime', String(audio.currentTime || 0));
      } catch {}
    }
    const target = getHomeHref();
    window.location.assign(target);
  }, [audioRef]);

  // Live room counts, shared across devices through Supabase.
  const [availability, setAvailability] = useState(null);
  const [availabilityError, setAvailabilityError] = useState('');

  // Host session (verified server side; token kept only for this tab).
  const [showLogin, setShowLogin] = useState(false);
  const [hostLoggedIn, setHostLoggedIn] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);

  const selected = getProperty(selectedId);
  const viewKey = dashboardOpen ? 'dashboard' : selectedId || 'list';

  const availabilityState = !bookingConfigured
    ? 'off'
    : availability
      ? 'ready'
      : availabilityError
        ? 'error'
        : 'loading';

  // Reveal animation for the current view (same helper as the invitation).
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

  // Keep the open property in sync with the URL hash (browser back/forward,
  // and refresh on e.g. /accommodation#svpc).
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

  // Load counts on mount; sync via broadcast + storage events + visibility check
  useEffect(() => {
    loadAvailability();
    const unsub = subscribeToDatabaseChanges(() => {
      loadAvailability();
    });
    const timer = setInterval(loadAvailability, 15000);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') loadAvailability();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      unsub();
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [loadAvailability]);

  // Restore a host session that survived a page refresh.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await restoreHostSession();
      if (!cancelled && token) setHostLoggedIn(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const countsFor = useCallback(
    (property) => {
      const total = property.rooms.length;
      if (availabilityState !== 'ready') return { total, booked: null, available: null };
      const map = availability[property.id] || {};
      const booked = property.rooms.filter((room) => map[room]).length;
      return { total, booked, available: total - booked };
    },
    [availability, availabilityState]
  );

  const handleSelect = useCallback((id) => {
    if (window.location.hash !== `#${id}`) {
      window.history.pushState(null, '', `#${id}`);
    }
    setSelectedId(id);
    window.scrollTo(0, 0);
  }, []);

  const handleBack = useCallback(() => {
    if (window.location.hash) {
      window.history.pushState(null, '', window.location.pathname + window.location.search);
    }
    setSelectedId(null);
    window.scrollTo(0, 0);
  }, []);

  const openDashboard = useCallback(() => {
    if (window.location.hash) {
      window.history.pushState(null, '', window.location.pathname + window.location.search);
    }
    setSelectedId(null);
    setDashboardOpen(true);
    window.scrollTo(0, 0);
  }, []);

  const exitDashboard = useCallback(() => {
    setDashboardOpen(false);
    window.scrollTo(0, 0);
  }, []);

  const handleLoginSuccess = useCallback(() => {
    setShowLogin(false);
    setHostLoggedIn(true);
    openDashboard();
    loadAvailability();
  }, [openDashboard, loadAvailability]);

  const handleLogout = useCallback(async () => {
    await logoutHost();
    setHostLoggedIn(false);
    setDashboardOpen(false);
  }, []);

  const handleSessionExpired = useCallback(() => {
    setHostLoggedIn(false);
    setDashboardOpen(false);
    setShowLogin(true);
  }, []);

  const showAvailabilityError = availabilityState === 'error';

  return (
    <div className="acc-page">
      <audio
        ref={audioRef}
        onEnded={handleSongEnded}
        onError={handleAudioError}
        preload="none"
      />
      <MusicToggle playing={musicPlaying} onToggle={toggleMusic} />
      <header className="acc-topbar">
        <a className="acc-home-link" href={homeHref} onClick={handleBackToInvitation}>
          ← Invitation
        </a>
        <div className="acc-topbar-actions">
          {bookingConfigured && !hostLoggedIn && !showLogin && (
            <button type="button" className="acc-host-link" onClick={() => setShowLogin(true)}>
              Host Login
            </button>
          )}
          {hostLoggedIn && !dashboardOpen && (
            <button type="button" className="acc-host-link" onClick={openDashboard}>
              Host Dashboard
            </button>
          )}
          {hostLoggedIn && (
            <button type="button" className="acc-host-link is-logout" onClick={handleLogout}>
              Logout
            </button>
          )}
          <button
            className="theme-toggle"
            type="button"
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            aria-pressed={String(isDark)}
            onClick={() =>
              setIsDark((prev) => {
                const next = !prev;
                try {
                  localStorage.setItem('weddingTheme', next ? 'dark' : 'light');
                } catch {}
                return next;
              })
            }
          >
            {isDark ? '☀' : '☾'}
          </button>
        </div>
      </header>

      <main className="acc-main">
        <section className="acc-hero">
          <p className="eyebrow">BHUVAN &amp; MANASA · 12 DECEMBER 2026</p>
          <h1>Wedding Accommodation</h1>
          <p className="acc-subtitle">A comfortable stay for our beloved family and guests.</p>
          <Ornament />
        </section>

        {!selected && !dashboardOpen && (
          <section className="acc-options" aria-label="Accommodation options">
            <div className="acc-card-grid">
              {PROPERTIES.map((property, index) => {
                const counts = countsFor(property);
                return (
                  <button
                    key={property.id}
                    type="button"
                    className="acc-card reveal"
                    onClick={() => handleSelect(property.id)}
                    aria-label={`View room availability for ${property.name}`}
                  >
                    <span className="acc-card-art">
                      <StayArt variant={property.id} uid="card" />
                      <FloralVine />
                    </span>
                    <span className="acc-card-body">
                      <span className="acc-card-eyebrow">Stay {String(index + 1).padStart(2, '0')}</span>
                      <strong className="acc-card-title">{property.name}</strong>
                      <span className="acc-card-copy">{property.blurb}</span>
                      <span className="acc-card-stats">
                        <span className="acc-stat">
                          <strong>{counts.total}</strong>
                          <em>Total Rooms</em>
                        </span>
                        <span className="acc-stat is-booked">
                          <strong>{counts.booked === null ? '—' : counts.booked}</strong>
                          <em>Booked</em>
                        </span>
                        <span className="acc-stat is-free">
                          <strong>{counts.available === null ? '—' : counts.available}</strong>
                          <em>Available</em>
                        </span>
                      </span>
                      <span className="acc-card-cta">View Rooms →</span>
                    </span>
                  </button>
                );
              })}
            </div>
            {showAvailabilityError && (
              <p className="acc-status-error" role="status">
                Live room availability is temporarily unavailable.
              </p>
            )}
            <p className="acc-note reveal">
              Guest details stay private — only room availability is shown on this page.
            </p>
          </section>
        )}

        {dashboardOpen && hostLoggedIn && (
          <HostDashboard
            availability={availability}
            availabilityState={availabilityState}
            onAvailabilityRefresh={loadAvailability}
            onExit={exitDashboard}
            onLogout={handleLogout}
            onSessionExpired={handleSessionExpired}
          />
        )}

        {selected && !dashboardOpen && (
          <section className="acc-detail" aria-labelledby="acc-detail-title">
            <button type="button" className="acc-back reveal" onClick={handleBack}>
              ← Back to accommodation options
            </button>

            <div className="acc-detail-head reveal">
              <div className="acc-detail-art">
                <StayArt variant={selected.id} uid="detail" />
              </div>
              <div className="acc-detail-intro">
                <p className="acc-eyebrow">Accommodation</p>
                <h2 id="acc-detail-title">{selected.name}</h2>
                <p className="acc-detail-copy">{selected.blurb}</p>
                <SummaryChips counts={countsFor(selected)} />
              </div>
            </div>

            <div className="acc-panel reveal">
              <AvailabilityTable
                property={selected}
                availability={availability}
                availabilityState={availabilityState}
              />
              {showAvailabilityError && (
                <p className="acc-status-error" role="status">
                  Live room availability is temporarily unavailable.
                </p>
              )}
            </div>

            {selected.mapUrl && (
              <div className="acc-panel acc-location reveal">
                <div className="acc-location-text">
                  <p className="acc-eyebrow">Location</p>
                  <h3>{selected.name}</h3>
                  <p>Open the address in Google Maps for directions to your stay.</p>
                </div>
                <a
                  className="gold-button"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={selected.mapUrl}
                >
                  📍 Open in Google Maps
                </a>
              </div>
            )}

            <p className="acc-note reveal">
              Please keep this information within our wedding guests. In case of any changes, feel free to reach out
              to us directly.
            </p>
          </section>
        )}
      </main>

      <HostLoginDialog open={showLogin} onClose={() => setShowLogin(false)} onSuccess={handleLoginSuccess} />

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
