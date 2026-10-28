const GALLERY_PHOTOS = [
  { src: '/assets/gallery/A25I9462.webp', alt: 'PelliKoduku celebration', className: 'item-1' },
  { src: '/assets/gallery/A25I8942.webp', alt: 'Haldi celebration', className: 'item-2' },
  { src: '/assets/gallery/A25I9111.webp', alt: 'Mehendi celebration', className: 'item-3' },
  { src: '/assets/gallery/A25I9163.webp', alt: 'Wedding celebration', className: 'item-4' },
  { src: '/assets/gallery/A25I9108.webp', alt: 'Wedding moment', className: 'item-5' },
  { src: '/assets/gallery/A25I8862.webp', alt: 'Wedding moment', className: 'item-6' },
  { src: '/assets/gallery/A25I8939.webp', alt: 'Wedding moment', className: 'item-7' },
  { src: '/assets/gallery/A25I8946.webp', alt: 'Wedding moment', className: 'item-8' },
  { src: '/assets/A25I9157.JPG', alt: 'Wedding portrait', className: 'item-9' },
  { src: '/assets/A25I9176.JPG', alt: 'Wedding celebration', className: 'item-10' },
];

const GALLERY_ROWS = [
  GALLERY_PHOTOS.slice(0, 5),
  GALLERY_PHOTOS.slice(5),
];

function GalleryPhoto({ img }) {
  return (
    <div className={`collage-item ${img.className}`}>
      <img
        src={img.src}
        alt={img.alt}
        loading="lazy"
        decoding="async"
        sizes="(max-width: 520px) 46vw, (max-width: 760px) 30vw, (max-width: 1050px) 22vw, 36vw"
      />
    </div>
  );
}

function Gallery() {
  return (
    <section className="gallery-section section-paper">
      <div className="section-inner wide reveal">
        <p className="eyebrow">A FEW MOMENTS OF JOY</p>
        <h2>Our Celebration</h2>

        <div className="photo-collage">
          {GALLERY_ROWS.map((row, rowIndex) => (
            <div key={rowIndex} className="photo-collage-row">
              {row.map((img) => (
                <GalleryPhoto key={img.className} img={img} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Gallery;
