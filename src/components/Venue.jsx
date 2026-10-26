const MAPS_URL =
  'https://www.google.com/maps/place/SVPC+CONVENTIONS/@17.0438279,81.794505,12.69z/data=!4m6!3m5!1s0x3a37a173580ba0c1:0xf660ea509c425358!8m2!3d17.0387557!4d81.8332866!16s%2Fg%2F11nz344pws?entry=ttu&g_ep=EgoyMDI2MDkwMS4wIKXMDSoASAFQAw%3D%3D';

function Venue() {
  return (
    <section id="venue" className="venue-section section-sage">
      <div className="venue-card reveal">
        <br />
        <br />
        <br />
        <h2>SVPC CONVENTIONS</h2>
        <p className="venue-copy">
          We would be honoured to have you with us as we begin our new chapter.
        </p>
        <div className="map-wrap">
          <iframe
            title="SVPC Conventions location on Google Maps"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src="https://www.google.com/maps?q=SVPC%20CONVENTIONS%2C%2017.0387557%2C81.8332866&z=15&output=embed"
          ></iframe>
        </div>
        <a
          className="gold-button"
          target="_blank"
          rel="noopener noreferrer"
          href={MAPS_URL}
        >
          📍 Open in Google Maps
        </a>
      </div>
    </section>
  );
}

export default Venue;
