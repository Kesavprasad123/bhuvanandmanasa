import { useCallback } from 'react';

function FloatingNav({ isDark, onToggleTheme }) {
  const handleSmoothScroll = useCallback((e) => {
    const href = e.currentTarget.getAttribute('href');
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <nav className="floating-nav" aria-label="Invitation navigation">
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
      <a href="#home" onClick={handleSmoothScroll}>శుభారంభం</a>
      <a href="#story" onClick={handleSmoothScroll}>వధూవరులు</a>
      <a href="#events" onClick={handleSmoothScroll}>శుభకార్యాలు</a>
      <a href="#venue" onClick={handleSmoothScroll}>కళ్యాణ వేదిక</a>
    </nav>
  );
}

export default FloatingNav;
