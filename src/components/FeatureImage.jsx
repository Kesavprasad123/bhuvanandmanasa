const BASE = import.meta.env.BASE_URL || './';
const cleanBase = BASE.endsWith('/') ? BASE : `${BASE}/`;
const featureImgSrc = `${cleanBase}assets/feature-img.webp`;

function FeatureImage() {
  return (
    <section className="feature-section">
      <img
        src={featureImgSrc}
        alt="Bhuvan and Manasa wedding celebration"
        loading="lazy"
        decoding="async"
        width="1672"
        height="941"
      />
      <div className="feature-overlay"></div>
      <div className="feature-copy reveal">
        <p>THE BEGINNING OF FOREVER</p>
        <br />
        <h2>Bhuvan &hearts; Manasa</h2>
        <span>12 • 12 • 2026</span>
      </div>
    </section>
  );
}

export default FeatureImage;
