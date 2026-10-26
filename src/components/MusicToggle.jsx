function MusicToggle({ playing, onToggle }) {
  return (
    <button
      id="musicToggle"
      className={`music-toggle${playing ? ' playing' : ''}`}
      type="button"
      aria-label={playing ? 'Pause wedding music' : 'Play wedding music'}
      aria-pressed={String(playing)}
      onClick={onToggle}
    >
      {playing ? '🔊' : '♪'}
    </button>
  );
}

export default MusicToggle;
