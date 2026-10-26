import { useState, useEffect } from 'react';

const WEDDING_DATE = new Date('2026-12-12T20:24:00+05:30').getTime();

function Countdown() {
  const [time, setTime] = useState({ days: '00', hours: '00', minutes: '00', seconds: '00' });

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

  return (
    <section className="countdown-section section-paper">
      <div className="section-inner reveal">
        <p className="eyebrow">COUNTING EVERY MOMENT</p>
        <br />
        <h2>Until We Say "I Do"</h2>
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
    </section>
  );
}

export default Countdown;
