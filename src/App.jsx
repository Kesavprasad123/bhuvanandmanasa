import { useState, useEffect, useCallback, useRef } from 'react';
import FallingFlowers from './components/FallingFlowers';
import Opening from './components/Opening';
import MainInvitation from './components/MainInvitation';
import useScrollReveal from './hooks/useScrollReveal';

const WEDDING_SONGS = [
  '/assets/Raarandoi-veduka-choodham.mp3',
  '/assets/Alanati Ramachandrudu.mp3',
  '/assets/kalyanam-vybhogam.mp3',
  '/assets/marriage.mp3',
  '/assets/shararat.mp3',
  '/assets/Shatamanam Bhavati.mp3',
  '/assets/jaya-mangalam.mp3',
];

function App() {
  const [isOpen, setIsOpen] = useState(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash;
      const isDirectOpen =
        searchParams.get('opened') === 'true' ||
        hash === '#home' ||
        sessionStorage.getItem('weddingInvitationOpened') === 'true';
      if (isDirectOpen) {
        sessionStorage.setItem('weddingInvitationOpened', 'true');
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  });
  const [isDark, setIsDark] = useState(() => localStorage.getItem('weddingTheme') === 'dark');
  const [musicPlaying, setMusicPlaying] = useState(false);
  const audioRef = useRef(null);
  const songIndexRef = useRef(Number(localStorage.getItem('weddingSongIndex') || 0));

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

  // Initialize scroll reveal after site opens
  useScrollReveal(isOpen);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem('weddingTheme', next ? 'dark' : 'light');
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
      localStorage.setItem('weddingSongIndex', songIndexRef.current);
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
    startMusic();
    setTimeout(() => {
      try {
        sessionStorage.setItem('weddingInvitationOpened', 'true');
      } catch {
        // ignore
      }
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
        <MainInvitation
          musicPlaying={musicPlaying}
          onToggleMusic={toggleMusic}
          isDark={isDark}
          onToggleTheme={toggleTheme}
        />
      )}
    </>
  );
}

export default App;
