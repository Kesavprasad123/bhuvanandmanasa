import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import FallingFlowers from './components/FallingFlowers';
import Opening from './components/Opening';
import useScrollReveal from './hooks/useScrollReveal';

const loadMainInvitation = () => import('./components/MainInvitation');
const MainInvitation = lazy(loadMainInvitation);

const BASE = import.meta.env.BASE_URL || './';
const cleanBase = BASE.endsWith('/') ? BASE : `${BASE}/`;
const assetUrl = (p) => `${cleanBase}${p.replace(/^\/+/, '')}`;

const WEDDING_SONGS = [
  assetUrl('assets/Raarandoi-veduka-choodham.mp3'),
  assetUrl('assets/Alanati Ramachandrudu.mp3'),
  assetUrl('assets/kalyanam-vybhogam.mp3'),
  assetUrl('assets/marriage.mp3'),
  assetUrl('assets/shararat.mp3'),
  assetUrl('assets/Shatamanam Bhavati.mp3'),
  assetUrl('assets/jaya-mangalam.mp3'),
];

const getStoredTheme = () => {
  try {
    return localStorage.getItem('weddingTheme') === 'dark';
  } catch {
    return false;
  }
};

const getStoredSongIndex = () => {
  try {
    return Number(localStorage.getItem('weddingSongIndex') || 0);
  } catch {
    return 0;
  }
};

function App() {
  const [isOpen, setIsOpen] = useState(() => {
    try {
      return sessionStorage.getItem('weddingInviteOpened') === 'true' || window.location.hash.length > 1;
    } catch {
      return false;
    }
  });
  const [isDark, setIsDark] = useState(getStoredTheme);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const audioRef = useRef(null);
  const songIndexRef = useRef(getStoredSongIndex());

  // Apply theme
  useEffect(() => {
    document.body.classList.toggle('dark-theme', isDark);
  }, [isDark]);

  // Unlock body scroll when site is revealed
  useEffect(() => {
    if (isOpen) {
      document.body.classList.remove('locked');
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

  const startMusic = useCallback(async () => {
    try {
      const audio = audioRef.current;
      if (!audio) return;
      audio.src = WEDDING_SONGS[songIndexRef.current];
      audio.volume = 0.7;
      await audio.play();
      setMusicPlaying(true);
      songIndexRef.current = (songIndexRef.current + 1) % WEDDING_SONGS.length;
      try {
        localStorage.setItem('weddingSongIndex', songIndexRef.current);
      } catch {}
    } catch (error) {
      setMusicPlaying(false);
      console.warn('Wedding music is unavailable:', error.message);
    }
  }, []);

  const stopMusic = useCallback(() => {
    const audio = audioRef.current;
    if (audio) audio.pause();
    setMusicPlaying(false);
  }, []);

  const toggleMusic = useCallback(async () => {
    if (musicPlaying) {
      stopMusic();
    } else {
      await startMusic();
    }
  }, [musicPlaying, startMusic, stopMusic]);

  const handleOpenEnvelope = useCallback(() => {
    if (isOpen) return;
    try {
      sessionStorage.setItem('weddingInviteOpened', 'true');
    } catch {}
    startMusic();
    setTimeout(() => {
      setIsOpen(true);
      window.scrollTo(0, 0);
    }, 1550);
  }, [isOpen, startMusic]);

  return (
    <>
      <FallingFlowers />
      <audio ref={audioRef} loop preload="none" />

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
