import { useState, useEffect, useCallback, useRef } from 'react';

const BASE = import.meta.env.BASE_URL || './';
const cleanBase = BASE.endsWith('/') ? BASE : `${BASE}/`;
const asset = (p) => `${cleanBase}${p.replace(/^\/+/, '')}`;

/**
 * 8 Celebration Gallery Images:
 * - 2 Landscape photos of the couple together (1800x1274 & 1800x1200)
 * - 6 Portrait photos of ceremonies and wedding attire (1200x1800)
 *
 * Each image specifies its native resolution, orientation, and focal point
 * for pixel-perfect alignment across iOS/Android mobile and desktop/4K displays.
 */
const GALLERY_IMAGES = [
  // --- Pair 1: Signature Landscape Celebrations ---
  {
    id: 'celebration-prayer',
    src: asset('assets/gallery/A25I8946.webp'),
    alt: 'Bhuvan and Manasa seated together in prayer during auspicious wedding rituals',
    title: 'Auspicious Beginnings',
    subtitle: 'Bhuvan & Manasa • Seated in sacred prayer',
    badge: 'Holy Matrimony',
    orientation: 'landscape',
    width: 1800,
    height: 1274,
    objectPosition: 'center 28%',
    desktopClass: 'pos-1',
    mobileOrderClass: 'order-m-1',
  },
  {
    id: 'celebration-harmony',
    src: asset('assets/gallery/A25I9163.webp'),
    alt: 'Bhuvan and Manasa standing together in harmony and celebratory glow',
    title: 'Together in Harmony',
    subtitle: 'Two souls, one timeless journey',
    badge: 'Celebration',
    orientation: 'landscape',
    width: 1800,
    height: 1200,
    objectPosition: 'center 22%',
    desktopClass: 'pos-2',
    mobileOrderClass: 'order-m-4',
  },

  // --- Row 2 Portraits: Groom Namaste, Couple Bouquet, Bride Namaste ---
  {
    id: 'groom-namaste',
    src: asset('assets/gallery/A25I8942.webp'),
    alt: 'Groom Bhuvan seated with folded hands in namaste seeking blessings',
    title: 'The Groom',
    subtitle: 'Bhuvan • Seeking sacred blessings',
    badge: 'Pelli Koduku',
    orientation: 'portrait',
    width: 1200,
    height: 1800,
    objectPosition: 'center 25%',
    desktopClass: 'pos-3',
    mobileOrderClass: 'order-m-2',
  },
  {
    id: 'couple-bouquet',
    src: asset('assets/gallery/A25I9462.webp'),
    alt: 'Bhuvan and Manasa holding flower bouquet together with joyful smiles',
    title: 'Blossoms of Love',
    subtitle: 'Floral joy & warm wishes',
    badge: 'Cherished Moments',
    orientation: 'portrait',
    width: 1200,
    height: 1800,
    objectPosition: 'center 22%',
    desktopClass: 'pos-4',
    mobileOrderClass: 'order-m-7',
  },
  {
    id: 'bride-namaste',
    src: asset('assets/gallery/A25I8939.webp'),
    alt: 'Bride Manasa seated with folded hands in namaste radiant in grace',
    title: 'The Bride',
    subtitle: 'Manasa • Radiant in sacred grace',
    badge: 'Pelli Kuturu',
    orientation: 'portrait',
    width: 1200,
    height: 1800,
    objectPosition: 'center 25%',
    desktopClass: 'pos-5',
    mobileOrderClass: 'order-m-3',
  },

  // --- Row 3 Portraits: Groom Elegance, Couple Smiles, Bridal Grace ---
  {
    id: 'groom-elegance',
    src: asset('assets/gallery/A25I9108.webp'),
    alt: 'Groom Bhuvan standing handsome in black wedding celebration suit',
    title: 'Groom Elegance',
    subtitle: 'Bhuvan in celebration attire',
    badge: 'Wedding Splendor',
    orientation: 'portrait',
    width: 1200,
    height: 1800,
    objectPosition: 'center 18%',
    desktopClass: 'pos-6',
    mobileOrderClass: 'order-m-5',
  },
  {
    id: 'couple-smiles',
    src: asset('assets/gallery/A25I9111.webp'),
    alt: 'Bhuvan and Manasa standing smiling together warmly',
    title: 'Smiles of Joy',
    subtitle: 'Every smile a cherished chapter',
    badge: 'Forever Us',
    orientation: 'portrait',
    width: 1200,
    height: 1800,
    objectPosition: 'center 20%',
    desktopClass: 'pos-7',
    mobileOrderClass: 'order-m-8',
  },
  {
    id: 'bridal-grace',
    src: asset('assets/gallery/A25I8862.webp'),
    alt: 'Bride Manasa standing in traditional silk saree holding auspicious coconut',
    title: 'Bridal Grace',
    subtitle: 'Manasa with auspicious dravyam',
    badge: 'Traditional Splendor',
    orientation: 'portrait',
    width: 1200,
    height: 1800,
    objectPosition: 'center 20%',
    desktopClass: 'pos-8',
    mobileOrderClass: 'order-m-6',
  },
];

function Gallery() {
  const [activePhotoIndex, setActivePhotoIndex] = useState(null);
  const touchStartXRef = useRef(null);

  const openLightbox = (index) => {
    setActivePhotoIndex(index);
  };

  const closeLightbox = useCallback(() => {
    setActivePhotoIndex(null);
  }, []);

  const showNext = useCallback(() => {
    setActivePhotoIndex((prev) => (prev !== null ? (prev + 1) % GALLERY_IMAGES.length : null));
  }, []);

  const showPrev = useCallback(() => {
    setActivePhotoIndex((prev) =>
      prev !== null ? (prev - 1 + GALLERY_IMAGES.length) % GALLERY_IMAGES.length : null
    );
  }, []);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (activePhotoIndex === null) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowRight') {
        showNext();
      } else if (e.key === 'ArrowLeft') {
        showPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [activePhotoIndex, closeLightbox, showNext, showPrev]);

  // Touch swipe support for mobile
  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchStartXRef.current - touchEndX;
    touchStartXRef.current = null;

    if (deltaX > 45) {
      showNext();
    } else if (deltaX < -45) {
      showPrev();
    }
  };

  const activePhoto = activePhotoIndex !== null ? GALLERY_IMAGES[activePhotoIndex] : null;

  return (
    <section id="gallery" className="gallery-section section-paper">
      <div className="section-inner wide reveal">
        <p className="eyebrow">A FEW MOMENTS OF JOY</p>
        <h2>Our Celebration</h2>
        <p className="gallery-lead">
          Snapshots of warmth, laughter, and timeless traditions on our journey to forever.
        </p>

        <div className="photo-collage" role="region" aria-label="Wedding Photo Celebration Gallery">
          {GALLERY_IMAGES.map((img, index) => {
            const isLandscape = img.orientation === 'landscape';
            return (
              <button
                type="button"
                key={img.id}
                className={`collage-item ${isLandscape ? 'is-landscape' : 'is-portrait'} ${img.desktopClass} ${img.mobileOrderClass}`}
                onClick={() => openLightbox(index)}
                aria-label={`View ${img.title} photo full size`}
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  loading="lazy"
                  decoding="async"
                  width={img.width}
                  height={img.height}
                  style={{ objectPosition: img.objectPosition }}
                  sizes={
                    isLandscape
                      ? '(max-width: 600px) 95vw, (max-width: 900px) 94vw, 580px'
                      : '(max-width: 600px) 46vw, (max-width: 900px) 46vw, 380px'
                  }
                />
                <div className="collage-card-overlay">
                  <div className="collage-card-top-bar">
                    <span className="collage-badge">{img.badge}</span>
                    <span className="collage-expand-btn" aria-hidden="true" title="Expand photo">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 3 21 3 21 9" />
                        <polyline points="9 21 3 21 3 15" />
                        <line x1="21" y1="3" x2="14" y2="10" />
                        <line x1="3" y1="21" x2="10" y2="14" />
                      </svg>
                    </span>
                  </div>
                  <div className="collage-caption">
                    <h3 className="collage-title">{img.title}</h3>
                    <p className="collage-subtitle">{img.subtitle}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== INTERACTIVE FULLSCREEN LIGHTBOX MODAL ===== */}
      {activePhoto && (
        <div
          className="gallery-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${activePhoto.title} preview`}
          onClick={closeLightbox}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="lightbox-dialog"
            onClick={(e) => e.stopPropagation()}
            tabIndex={-1}
          >
            <button
              type="button"
              className="lightbox-close-btn"
              onClick={closeLightbox}
              aria-label="Close photo preview"
              title="Close preview (Esc)"
            >
              &times;
            </button>

            <button
              type="button"
              className="lightbox-nav-btn lightbox-prev-btn"
              onClick={showPrev}
              aria-label="Previous photo"
              title="Previous photo (Left arrow)"
            >
              &#8249;
            </button>

            <div className="lightbox-stage">
              <img
                src={activePhoto.src}
                alt={activePhoto.alt}
                width={activePhoto.width}
                height={activePhoto.height}
                decoding="async"
              />
            </div>

            <button
              type="button"
              className="lightbox-nav-btn lightbox-next-btn"
              onClick={showNext}
              aria-label="Next photo"
              title="Next photo (Right arrow)"
            >
              &#8250;
            </button>

            <div className="lightbox-footer">
              <div className="lightbox-info">
                <h3 className="lightbox-title">{activePhoto.title}</h3>
                <p className="lightbox-subtitle">{activePhoto.subtitle}</p>
              </div>
              <span className="lightbox-counter">
                {activePhotoIndex + 1} / {GALLERY_IMAGES.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default Gallery;
