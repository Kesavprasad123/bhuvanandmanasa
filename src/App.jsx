import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import FallingFlowers from './components/FallingFlowers';
import Opening from './components/Opening';
import useScrollReveal from './hooks/useScrollReveal';
import useWeddingMusic from './hooks/useWeddingMusic';
import { getAccommodationHref, getHomeHref } from './components/FloatingNav';

const loadMainInvitation = () => import('./components/MainInvitation');
const MainInvitation = lazy(loadMainInvitation);

const loadAccommodation = () => import('./components/Accommodation');
const Accommodation = lazy(loadAccommodation);

const getStoredTheme = () => {
  try {
    return localStorage.getItem('weddingTheme') === 'dark';
  } catch {
    return false;
  }
};

function getInitialRoute(initialPath) {
  if (initialPath) return initialPath;
  if (typeof window === 'undefined') return 'home';
  return /\/accommodation(?:\/|$)/i.test(window.location.pathname) ? 'accommodation' : 'home';
}

function App({ initialRoute = null }) {
  const [currentRoute, setCurrentRoute] = useState(() => getInitialRoute(initialRoute));
  const isInitiallyAccommodation = currentRoute === 'accommodation';
  const [isOpen, setIsOpen] = useState(isInitiallyAccommodation);
  const [isDark, setIsDark] = useState(getStoredTheme);

  const {
    audioRef,
    musicPlaying,
    startMusic,
    toggleMusic,
    handleSongEnded,
    handleAudioError,
  } = useWeddingMusic({ isLandingPage: !isInitiallyAccommodation });

  // On every initial load and page refresh of root, guarantee landing on the opening envelope screen
  useEffect(() => {
    if (isInitiallyAccommodation) return;

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
  }, [isInitiallyAccommodation]);

  // Sync route on browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const isAcc = /\/accommodation(?:\/|$)/i.test(window.location.pathname);
      setCurrentRoute(isAcc ? 'accommodation' : 'home');
      if (isAcc) {
        setIsOpen(true);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Apply theme
  useEffect(() => {
    document.body.classList.toggle('dark-theme', isDark);
  }, [isDark]);

  // Unlock body scroll when site is revealed or in accommodation
  useEffect(() => {
    if (isOpen || currentRoute === 'accommodation') {
      document.body.classList.remove('locked');
    } else {
      document.body.classList.add('locked');
    }
  }, [isOpen, currentRoute]);

  // Reduced motion
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.style.scrollBehavior = 'auto';
    }
  }, []);

  // Idle prefetch components
  useEffect(() => {
    const idleCallback = window.requestIdleCallback || ((cb) => setTimeout(cb, 800));
    const id = idleCallback(() => {
      loadMainInvitation();
      loadAccommodation();
    });
    return () => (window.cancelIdleCallback ? window.cancelIdleCallback(id) : null);
  }, []);

  // Scroll reveal
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

  // Seamless in-app navigation (NO PAGE RELOAD -> MUSIC NEVER STOPS!)
  const navigateToAccommodation = useCallback(() => {
    const target = getAccommodationHref();
    if (window.location.pathname !== target) {
      window.history.pushState(null, '', target);
    }
    setCurrentRoute('accommodation');
    setIsOpen(true);
    window.scrollTo(0, 0);
  }, []);

  const navigateToHome = useCallback(() => {
    const target = getHomeHref();
    if (window.location.pathname !== target) {
      window.history.pushState(null, '', target);
    }
    setCurrentRoute('home');
    setIsOpen(true);
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <FallingFlowers />
      {/* Root audio element that persists continuously across all views */}
      <audio
        ref={audioRef}
        onEnded={handleSongEnded}
        onError={handleAudioError}
        preload="none"
      />

      {currentRoute === 'accommodation' ? (
        <Suspense fallback={<div style={{ minHeight: '100vh', background: '#fbf3e9' }} />}>
          <Accommodation
            musicPlaying={musicPlaying}
            onToggleMusic={toggleMusic}
            isDark={isDark}
            onToggleTheme={toggleTheme}
            onBackToInvitation={navigateToHome}
          />
        </Suspense>
      ) : (
        <>
          <Opening isOpen={isOpen} onOpen={handleOpenEnvelope} />

          {isOpen && (
            <Suspense fallback={null}>
              <MainInvitation
                musicPlaying={musicPlaying}
                onToggleMusic={toggleMusic}
                isDark={isDark}
                onToggleTheme={toggleTheme}
                onNavigateToAccommodation={navigateToAccommodation}
              />
            </Suspense>
          )}
        </>
      )}
    </>
  );
}

export default App;
