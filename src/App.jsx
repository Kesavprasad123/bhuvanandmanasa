import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import FallingFlowers from './components/FallingFlowers';
import Opening from './components/Opening';
import useScrollReveal from './hooks/useScrollReveal';
import useWeddingMusic from './hooks/useWeddingMusic';

const loadMainInvitation = () => import('./components/MainInvitation');
const MainInvitation = lazy(loadMainInvitation);

const getStoredTheme = () => {
  try {
    return localStorage.getItem('weddingTheme') === 'dark';
  } catch {
    return false;
  }
};

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(getStoredTheme);

  const {
    audioRef,
    musicPlaying,
    startMusic,
    toggleMusic,
    handleSongEnded,
    handleAudioError,
  } = useWeddingMusic({ isLandingPage: true });

  // On every initial load and page refresh, guarantee landing on the opening envelope screen
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
    document.body.classList.add('locked');
    try {
      sessionStorage.removeItem('weddingInviteOpened');
    } catch {}
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

  // Apply theme
  useEffect(() => {
    document.body.classList.toggle('dark-theme', isDark);
  }, [isDark]);

  // Unlock body scroll when site is revealed
  useEffect(() => {
    if (isOpen) {
      document.body.classList.remove('locked');
    } else {
      document.body.classList.add('locked');
    }
  }, [isOpen]);

  // Reduced motion
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.style.scrollBehavior = 'auto';
    }
  }, []);

  // Idle prefetch MainInvitation while user is viewing the envelope
  useEffect(() => {
    const idleCallback = window.requestIdleCallback || ((cb) => setTimeout(cb, 800));
    const id = idleCallback(() => loadMainInvitation());
    return () => (window.cancelIdleCallback ? window.cancelIdleCallback(id) : null);
  }, []);

  // Initialize scroll reveal after site opens
  useScrollReveal(isOpen);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('weddingTheme', next ? 'dark' : 'light');
      } catch {}
      return next;
    });
  }, []);

  const handleOpenEnvelope = useCallback(() => {
    if (isOpen) return;
    startMusic();
    setTimeout(() => {
      setIsOpen(true);
      window.scrollTo(0, 0);
    }, 1550);
  }, [isOpen, startMusic]);

  return (
    <>
      <FallingFlowers />
      <audio
        ref={audioRef}
        onEnded={handleSongEnded}
        onError={handleAudioError}
        preload="none"
      />

      <Opening isOpen={isOpen} onOpen={handleOpenEnvelope} />

      {isOpen && (
        <Suspense fallback={null}>
          <MainInvitation
            musicPlaying={musicPlaying}
            onToggleMusic={toggleMusic}
            isDark={isDark}
            onToggleTheme={toggleTheme}
          />
        </Suspense>
      )}
    </>
  );
}

export default App;
