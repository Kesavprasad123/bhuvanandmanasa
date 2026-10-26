function Hero() {
  return (
    <section id="home" className="hero">
      <div className="hero-overlay"></div>
      <div className="hero-floral hero-floral-left"></div>
      <div className="hero-floral hero-floral-right"></div>
      <div className="hero-content reveal">
        <p className="eyebrow light-text">WITH THE BLESSINGS OF OUR FAMILIES</p>
        <br />
        <div className="hero-om">ॐ</div>
        <p className="hero-intro">Two hearts • One beautiful journey</p>
        <br />
        <br />
        <h1>
          <span>Bhuvan</span>
          <i>&hearts;</i>
          <span>Manasa</span>
        </h1>
        <a href="#story" className="scroll-button">
          Explore our celebration ↓
        </a>
      </div>
    </section>
  );
}

export default Hero;
