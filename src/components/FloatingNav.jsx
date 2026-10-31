import { useCallback, useEffect, useRef, useState } from 'react';

export function getAccommodationHref() {
  if (typeof window === 'undefined') return '/accommodation/';
  const pathname = window.location.pathname || '';
  const cleanPath = pathname.replace(/\/index\.html$/i, '').replace(/\/$/, '');
  return `${cleanPath}/accommodation/`;
}

export function getHomeHref() {
  if (typeof window === 'undefined') return '/';
  const pathname = window.location.pathname || '';
  const parent = pathname.replace(/\/accommodation(?:\/.*)?$/i, '');
  if (!parent || parent === '') return '/';
  return parent.endsWith('/') ? parent : `${parent}/`;
}

function FloatingNav({ isDark, onToggleTheme, onNavigateToAccommodation }) {
  const [open, setOpen] = useState(false);
  const [accommodationHref, setAccommodationHref] = useState(getAccommodationHref);
  const navRef = useRef(null);
  const hoverTimeoutRef = useRef(null);

  useEffect(() => {
    setAccommodationHref(getAccommodationHref());
  }, []);

  // Smooth-scroll only for in-page anchors
  const handleNavClick = useCallback((e) => {
    setOpen(false);
    const href = e.currentTarget.getAttribute('href') || '';
    if (!href.startsWith('#')) return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // Seamless in-app navigation to accommodation so music never stops
  const handleAccommodationClick = useCallback(
    (e) => {
      e.preventDefault();
      setOpen(false);
      if (onNavigateToAccommodation) {
        onNavigateToAccommodation();
      } else {
        window.location.assign(getAccommodationHref());
      }
    },
    [onNavigateToAccommodation]
  );

  // Desktop mouse hover support
  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setOpen(true);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setOpen(false);
    }, 220);
  };

  // Close the menu on Escape or a tap/click outside the nav
  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const onPointerDown = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, [open]);

  return (
    <nav
      ref={navRef}
      className={`floating-nav${open ? ' is-open' : ''}`}
      aria-label="Invitation navigation"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="nav-bar-pill">
        <button
          id="themeToggle"
          className="theme-toggle"
          type="button"
          aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          aria-pressed={String(isDark)}
          onClick={onToggleTheme}
        >
          {isDark ? '☀' : '☾'}
        </button>

        {/* 3 lines menu icon button */}
        <button
          className="nav-menu-btn"
          type="button"
          aria-expanded={String(open)}
          aria-controls="floating-nav-links"
          aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
          onClick={(e) => {
            e.stopPropagation();
            setOpen((value) => !value);
          }}
        >
          <span className="hamburger-icon" aria-hidden="true">
            <span className={`bar bar-1${open ? ' is-open' : ''}`} />
            <span className={`bar bar-2${open ? ' is-open' : ''}`} />
            <span className={`bar bar-3${open ? ' is-open' : ''}`} />
          </span>
        </button>
      </div>

      <div className="floating-nav-links" id="floating-nav-links">
        <a href="#home" onClick={handleNavClick}>శుభారంభం</a>
        <a href="#story" onClick={handleNavClick}>వధూవరులు</a>
        <a href="#events" onClick={handleNavClick}>శుభకార్యాలు</a>
        <a href="#venue" onClick={handleNavClick}>కళ్యాణ వేదిక</a>
        <a href={accommodationHref} onClick={handleAccommodationClick}>విడిది ఇల్లు</a>
      </div>
    </nav>
  );
}

export default FloatingNav;
