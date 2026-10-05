export default function initGalleryMusic(){
  const run = function () {
      const audio = document.getElementById('galleryMusic');
      const btn = document.getElementById('galleryMusicToggle');
      if (!audio || !btn) return;
      let started = false;

      function syncButton() {
        const playing = !audio.paused && !audio.ended;
        btn.textContent = playing ? '⏸' : '▶';
        btn.setAttribute('aria-pressed', String(playing));
        btn.setAttribute('aria-label', playing ? 'Pause gallery music' : 'Play gallery music');
      }
      audio.addEventListener('play', syncButton);
      audio.addEventListener('pause', syncButton);

      async function play() {
        try {
          audio.volume = 0.6;
          await audio.play();
          started = true;
          syncButton();
        } catch (e) { /* autoplay blocked by browser */ }
      }

      // Try to start immediately when the gallery opens
      play();
      window.addEventListener('pageshow', play);

      // Fallbacks in case the browser blocks autoplay
      document.addEventListener('pointerdown', function startOnce(e) {
        if (e.target === btn) return;
        if (!started) play();
        if (started) document.removeEventListener('pointerdown', startOnce);
      });
      document.addEventListener('touchend', function t() { if (!started) play(); else document.removeEventListener('touchend', t); });
      document.addEventListener('keydown', function k() { if (!started) play(); else document.removeEventListener('keydown', k); });

      btn.addEventListener('click', function () {
        if (audio.paused) {
          const videosPanel = document.getElementById('videosPanel');
          if (videosPanel && !videosPanel.hidden) return; // no background music on Videos tab
          play();
        } else {
          audio.pause();
          started = true;
          syncButton();
        }
      });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
}
