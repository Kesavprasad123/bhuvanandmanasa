import { useState, useEffect, useCallback, useRef } from 'react';
import FallingFlowers from './components/FallingFlowers';
import Opening from './components/Opening';
import MusicToggle from './components/MusicToggle';
import FloatingNav from './components/FloatingNav';
import Hero from './components/Hero';
import Countdown from './components/Countdown';
import Families from './components/Families';
import Events from './components/Events';
import FeatureImage from './components/FeatureImage';
import Gallery from './components/Gallery';
import Venue from './components/Venue';
import FinalSection from './components/FinalSection';
import Footer from './components/Footer';
import useScrollReveal from './hooks/useScrollReveal';

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('weddingTheme') === 'dark');
  const [musicPlaying, setMusicPlaying] = useState(false);
  const audioRef = useRef(null);
  const songIndexRef = useRef(Number(localStorage.getItem('weddingSongIndex') || 0));

  const weddingSongs = [
    '/assets/Raarandoi-veduka-choodham.mp3',
    '/assets/Alanati Ramachandrudu.mp3',
    '/assets/kalyanam-vybhogam.mp3',
    '/assets/marriage.mp3',
    '/assets/shararat.mp3',
    '/assets/Shatamanam Bhavati.mp3',
    '/assets/jaya-mangalam.mp3',
  ];

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
      audio.src = weddingSongs[songIndexRef.current];
      audio.volume = 0.7;
      await audio.play();
      setMusicPlaying(true);
      songIndexRef.current = (songIndexRef.current + 1) % weddingSongs.length;
      localStorage.setItem('weddingSongIndex', songIndexRef.current);
    } catch (error) {
      setMusicPlaying(false);
      console.warn('Wedding music is unavailable:', error.message);
    }
  }, [weddingSongs]);

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
      setIsOpen(true);
      window.scrollTo(0, 0);
    }, 1550);
  }, [isOpen, startMusic]);

  return (
    <>
      <FallingFlowers />
      <audio ref={audioRef} loop preload="auto" />

      <Opening isOpen={isOpen} onOpen={handleOpenEnvelope} />

      {isOpen && (
        <main id="site">
          <MusicToggle playing={musicPlaying} onToggle={toggleMusic} />
          <FloatingNav isDark={isDark} onToggleTheme={toggleTheme} />
          <Hero />
          <Countdown />
          <Families />
          <Events />
          <FeatureImage />
          <Gallery />
          <Venue />
          <FinalSection />
          <Footer />
        </main>
      )}
    </>
  );
}

export default App;
