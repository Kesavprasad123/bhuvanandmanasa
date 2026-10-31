import { useState, useEffect, useRef, useCallback } from 'react';

export const SONG_FILES = [
  'assets/Raarandoi-veduka-choodham.mp3',
  'assets/Alanati Ramachandrudu.mp3',
  'assets/kalyanam-vybhogam.mp3',
  'assets/marriage.mp3',
  'assets/shararat.mp3',
  'assets/Shatamanam Bhavati.mp3',
  'assets/jaya-mangalam.mp3',
];

/**
 * Resolves static asset URL relative to root deployment path.
 * Works on domain root (/), GitHub Pages subpath (/repo/), and local dev server,
 * from both / and /accommodation/.
 */
export function getRootAssetUrl(relativePath) {
  const cleanRelative = relativePath.replace(/^\/+/, '');
  if (typeof window === 'undefined') return `/${cleanRelative}`;
  const pathname = window.location.pathname || '';
  const root = pathname.replace(/\/accommodation(?:\/.*)?$/i, '');
  const base = root ? (root.endsWith('/') ? root : `${root}/`) : '/';
  return `${base}${cleanRelative}`;
}

const getStoredSongIndex = () => {
  try {
    const val = localStorage.getItem('weddingSongIndex');
    if (val !== null) {
      const parsed = parseInt(val, 10);
      if (!isNaN(parsed) && parsed >= 0) {
        return parsed % SONG_FILES.length;
      }
    }
  } catch {}
  return 0;
};

/**
 * Shared wedding background music hook for Main Invitation & Accommodation.
 *
 * Requirements handled:
 * 1. Sequential playback: When a song completes, automatically switches to the next song.
 * 2. On every refresh: Automatically changes to a different song in the playlist.
 * 3. Cross-page continuity: Continues playing smoothly when switching to Accommodation and back.
 */
export function useWeddingMusic({ autoStartIfActive = false, isLandingPage = false } = {}) {
  const [musicPlaying, setMusicPlaying] = useState(false);
  const audioRef = useRef(null);

  // Initialize song index
  const songIndexRef = useRef(() => {
    const stored = getStoredSongIndex();
    if (isLandingPage) {
      // Rotate to next song on every page refresh
      const nextOnRefresh = (stored + 1) % SONG_FILES.length;
      try {
        localStorage.setItem('weddingSongIndex', String(nextOnRefresh));
      } catch {}
      return nextOnRefresh;
    }
    return stored;
  });

  const [currentSongIndex, setCurrentSongIndex] = useState(songIndexRef.current);

  // Save playback position before leaving the page
  useEffect(() => {
    const handleBeforeUnload = () => {
      const audio = audioRef.current;
      if (audio && !audio.paused) {
        try {
          sessionStorage.setItem('weddingMusicActive', 'true');
          sessionStorage.setItem('weddingSongIndex', String(songIndexRef.current));
          sessionStorage.setItem('weddingSongTime', String(audio.currentTime || 0));
        } catch {}
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const playSongAtIndex = useCallback(async (index, startTime = 0) => {
    const audio = audioRef.current;
    if (!audio) return;

    const safeIndex = (index + SONG_FILES.length) % SONG_FILES.length;
    songIndexRef.current = safeIndex;
    setCurrentSongIndex(safeIndex);

    try {
      localStorage.setItem('weddingSongIndex', String(safeIndex));
      sessionStorage.setItem('weddingSongIndex', String(safeIndex));
      sessionStorage.setItem('weddingMusicActive', 'true');
    } catch {}

    const songUrl = getRootAssetUrl(SONG_FILES[safeIndex]);
    if (audio.src !== songUrl && !audio.src.endsWith(encodeURI(SONG_FILES[safeIndex]))) {
      audio.src = songUrl;
    }

    if (startTime > 0) {
      try {
        audio.currentTime = startTime;
      } catch {}
    }

    audio.volume = 0.7;

    try {
      await audio.play();
      setMusicPlaying(true);
    } catch (err) {
      console.warn('Wedding music play deferred until interaction:', err.message);
      setMusicPlaying(false);
    }
  }, []);

  const playNextSong = useCallback(() => {
    const nextIndex = (songIndexRef.current + 1) % SONG_FILES.length;
    playSongAtIndex(nextIndex, 0);
  }, [playSongAtIndex]);

  const startMusic = useCallback(() => {
    playSongAtIndex(songIndexRef.current, 0);
  }, [playSongAtIndex]);

  const stopMusic = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
    }
    setMusicPlaying(false);
    try {
      sessionStorage.setItem('weddingMusicActive', 'false');
      sessionStorage.removeItem('weddingSongTime');
    } catch {}
  }, []);

  const toggleMusic = useCallback(() => {
    if (musicPlaying) {
      stopMusic();
    } else {
      const audio = audioRef.current;
      if (audio && audio.src && audio.currentTime > 0) {
        audio.play().then(() => {
          setMusicPlaying(true);
          try {
            sessionStorage.setItem('weddingMusicActive', 'true');
          } catch {}
        }).catch(() => {
          playSongAtIndex(songIndexRef.current, 0);
        });
      } else {
        playSongAtIndex(songIndexRef.current, 0);
      }
    }
  }, [musicPlaying, playSongAtIndex, stopMusic]);

  // Handle song completion: automatically play next song
  const handleSongEnded = useCallback(() => {
    playNextSong();
  }, [playNextSong]);

  // Auto-start on pages like Accommodation if music was already active in the session
  useEffect(() => {
    if (!autoStartIfActive) return;

    let wasActive = false;
    let savedTime = 0;
    try {
      wasActive = sessionStorage.getItem('weddingMusicActive') === 'true';
      const storedTime = parseFloat(sessionStorage.getItem('weddingSongTime') || '0');
      if (!isNaN(storedTime) && storedTime > 0) {
        savedTime = storedTime;
      }
    } catch {}

    if (wasActive) {
      playSongAtIndex(songIndexRef.current, savedTime);
    }
  }, [autoStartIfActive, playSongAtIndex]);

  return {
    audioRef,
    musicPlaying,
    currentSongIndex,
    startMusic,
    stopMusic,
    toggleMusic,
    playNextSong,
    handleSongEnded,
  };
}

export default useWeddingMusic;
