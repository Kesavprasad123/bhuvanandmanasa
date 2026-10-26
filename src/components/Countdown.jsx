import { useState, useEffect, useCallback, useRef } from 'react';
import ScratchCard from './ScratchCard';

const WEDDING_DATE = new Date('2026-12-12T20:26:00+05:30').getTime();

function Countdown() {
  const [time, setTime] = useState({ days: '00', hours: '00', minutes: '00', seconds: '00' });
  const [stage, setStage] = useState('scratch'); // 'scratch' | 'countdown'
  const [leaving, setLeaving] = useState(false);
  const timersRef = useRef([]);

  useEffect(() => {
    function update() {
      const remaining = Math.max(0, WEDDING_DATE - Date.now());
      setTime({
        days: String(Math.floor(remaining / 86400000)).padStart(2, '0'),
        hours: String(Math.floor(remaining / 3600000) % 24).padStart(2, '0'),
        minutes: String(Math.floor(remaining / 60000) % 60).padStart(2, '0'),
        seconds: String(Math.floor(remaining / 1000) % 60).padStart(2, '0'),
      });
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  // clear transition timers
  useEffect(
    () => () => {
      timersRef.current.forEach((id) => clearTimeout(id));
      timersRef.current = [];
    },
    []
  );

  // celebrate the reveal, then flow into the countdown
  const handleRevealed = useCallback(() => {
    timersRef.current.push(setTimeout(() => setLeaving(true), 3000));
    timersRef.current.push(setTimeout(() => setStage('countdown'), 3750));
  }, []);

  return (
    <section className="countdown-section section-paper">
      <div className="section-inner reveal">
        {stage === 'scratch' ? (
          <div className={`scratch-stage${leaving ? ' is-leaving' : ''}`}>
            <div className="scratch-decor" aria-hidden="true">
              <span
                className="blush side"
                style={{ left: '1%', top: '36%', fontSize: '20px', animationDuration: '7s' }}
              >
                🌸
              </span>
              <span
                className="gold top"
                style={{ left: '5%', top: '14%', fontSize: '16px', animationDuration: '6s' }}
              >
                ❀
              </span>
              <span
                className="gold low"
                style={{ left: '4%', top: '70%', fontSize: '14px', animationDuration: '8s' }}
              >
                ✦
              </span>
              <span
                className="blush side"
                style={{ right: '1%', top: '44%', fontSize: '17px', animationDuration: '7.5s' }}
              >
                ✿
              </span>
              <span
                className="gold top"
                style={{ right: '5%', top: '18%', fontSize: '15px', animationDuration: '6.5s' }}
              >
                ✧
              </span>
              <span
                className="blush low"
                style={{ right: '4%', top: '74%', fontSize: '19px', animationDuration: '9s' }}
              >
                🌸
              </span>
              <span
                className="gold side"
                style={{ left: '12%', top: '54%', fontSize: '11px', animationDuration: '5.5s' }}
              >
                ✦
              </span>
              <span
                className="gold side"
                style={{ right: '12%', top: '60%', fontSize: '12px', animationDuration: '6.2s' }}
              >
                ✧
              </span>
            </div>

            <p className="eyebrow">A LITTLE SURPRISE</p>
            <h2>Until We Say &ldquo;I Do&rdquo;</h2>
            <p className="scratch-subtitle">Scratch to reveal our special date</p>

            <ScratchCard onRevealed={handleRevealed} />

            <p className="scratch-hint">
              Use your finger or mouse to gently scratch the golden layer
            </p>
          </div>
        ) : (
          <div className="countdown-stage">
            <h2>Counting Every Moment 💗</h2>
            <div className="countdown">
              <div>
                <strong id="days">{time.days}</strong>
                <span>Days</span>
              </div>
              <div>
                <strong id="hours">{time.hours}</strong>
                <span>Hours</span>
              </div>
              <div>
                <strong id="minutes">{time.minutes}</strong>
                <span>Minutes</span>
              </div>
              <div>
                <strong id="seconds">{time.seconds}</strong>
                <span>Seconds</span>
              </div>
            </div>
            <p className="telugu">మా కల్యాణ వేడుకకు మీ రాకే మా ఆనందం</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default Countdown;
