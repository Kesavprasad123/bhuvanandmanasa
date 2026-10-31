import { useCallback, useEffect, useRef, useState } from 'react';

export function getAccommodationHref() {
  if (typeof window === 'undefined') return '/accommodation/';
  const pathname = window.location.pathname || '';
  const cleanPath = pathname.replace(/\/index\.html$/i, '').replace(/\/$/, '');
  return `${cleanPath}/accommodation/`;
}

function FloatingNav({ isDark, onToggleTheme }) {
  const [open, setOpen] = useState(false);
  const [accommodationHref, setAccommodationHref] = useState(getAccommodationHref);
  const navRef = useRef(null);

  useEffect(() => {
    setAccommodationHref(getAccommodationHref());
  }, []);

  // Smooth-scroll only for in-page anchors; full-page links such as
  // /accommodation must fall through to normal navigation.
  const handleNavClick = useCallback((e) => {
    setOpen(false);
    const href = e.currentTarget.getAttribute('href') || '';
    if (!href.startsWith('#')) return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // Close the mobile menu on Escape or a tap/click outside the nav.
  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const onPointerDown = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) setOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  return (
    <nav
      ref={navRef}
      className={`floating-nav${open ? ' is-open' : ''}`}
      aria-label="Invitation navigation"
    >
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

      {/* Shown on mobile/tablet only — toggles the link panel below. */}
      <button
        className="nav-menu-btn"
        type="button"
        aria-expanded={String(open)}
        aria-controls="floating-nav-links"
        aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
        onClick={() => setOpen((value) => !value)}
      >
        <span aria-hidden="true">{open ? '✕' : '☰'}</span>
      </button>

      <div className="floating-nav-links" id="floating-nav-links">
        <a href="#home" onClick={handleNavClick}>శుభారంభం</a>
        <a href="#story" onClick={handleNavClick}>వధూవరులు</a>
        <a href="#events" onClick={handleNavClick}>శుభకార్యాలు</a>
        <a href="#venue" onClick={handleNavClick}>కళ్యాణ వేదిక</a>
        <a href={accommodationHref} onClick={handleNavClick}>వసతి సదుపాయాలు</a>
      </div>
    </nav>
  );
}

export default FloatingNav;
