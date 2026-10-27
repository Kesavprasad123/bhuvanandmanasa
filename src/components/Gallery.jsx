import { useEffect, useMemo, useState } from 'react';

const GALLERY_IMAGES = [
  { src: '/assets/gallery/A25I9462.jpg', alt: 'PelliKoduku celebration', className: 'item-1 is-sideways', width: 1800, height: 1200, ratio: 2 / 3 },
  { src: '/assets/gallery/A25I8942.jpg', alt: 'Haldi celebration', className: 'item-2 is-sideways', width: 1800, height: 1200, ratio: 2 / 3 },
  { src: '/assets/gallery/A25I9111.jpg', alt: 'Mehendi celebration', className: 'item-3 is-sideways', width: 1800, height: 1200, ratio: 2 / 3 },
  { src: '/assets/gallery/A25I9163.jpg', alt: 'Wedding celebration', className: 'item-4', width: 1800, height: 1200, ratio: 3 / 2 },
  { src: '/assets/gallery/A25I9108.jpg', alt: 'Wedding moment', className: 'item-5 is-sideways', width: 1800, height: 1200, ratio: 2 / 3 },
  { src: '/assets/gallery/A25I8862.jpg', alt: 'Wedding moment', className: 'item-6 is-sideways', width: 1800, height: 1200, ratio: 2 / 3 },
  { src: '/assets/gallery/A25I8939.jpg', alt: 'Wedding moment', className: 'item-7 is-sideways', width: 1800, height: 1200, ratio: 2 / 3 },
  { src: '/assets/gallery/A25I8946.jpg', alt: 'Wedding moment', className: 'item-8', width: 1800, height: 1274, ratio: 900 / 637 },
  { src: '/assets/gallery/couple-standing.jpg', alt: 'Bhuvan and Manasa standing together', className: 'item-9', width: 768, height: 1152, ratio: 2 / 3 },
  { src: '/assets/gallery/couple-seated.jpg', alt: 'Bhuvan and Manasa seated together', className: 'item-10', width: 1152, height: 768, ratio: 3 / 2 },
];

const PHOTO_ROWS = {
  desktop: [[0, 1, 3, 2, 4], [5, 7, 6, 8, 9]],
  tablet: [[0, 1, 3], [2, 4, 7], [5, 6, 8, 9]],
  mobile: [[0, 3], [1, 7], [2, 9], [4, 5], [6, 8]],
  narrow: GALLERY_IMAGES.map((_, index) => [index]),
};

function Gallery() {
  const [layout, setLayout] = useState('desktop');
  const rows = useMemo(
    () => PHOTO_ROWS[layout].map((indices) => indices.map((index) => GALLERY_IMAGES[index])),
    [layout],
  );

  useEffect(() => {
    const updateLayout = () => {
      const width = window.innerWidth;
      const nextLayout = width <= 360 ? 'narrow' : width <= 640 ? 'mobile' : width <= 950 ? 'tablet' : 'desktop';
      setLayout((current) => current === nextLayout ? current : nextLayout);
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, []);

  return (
    <section className="gallery-section section-paper">
      <div className="section-inner wide reveal">
        <p className="eyebrow">A FEW MOMENTS OF JOY</p>
        <h2>Our Celebration</h2>

        <div className={`photo-collage ${layout}`}>
          {rows.map((row, rowIndex) => (
            <div key={`row-${rowIndex}`} className="photo-row">
              {row.map((img) => (
                <div
                  key={img.className}
                  className={`collage-item ${img.className}`}
                  style={{ '--photo-ratio': img.ratio }}
                >
                  <img
                    src={img.src}
                    alt={img.alt}
                    loading="lazy"
                    decoding="async"
                    width={img.width}
                    height={img.height}
                    sizes="(max-width: 380px) 94vw, (max-width: 640px) 46vw, (max-width: 950px) 30vw, 22vw"
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Gallery;
