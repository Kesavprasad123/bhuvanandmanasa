const GALLERY_IMAGES = [
  { src: '/assets/gallery/A25I9462.jpg', alt: 'PelliKoduku celebration', className: 'item-1' },
  { src: '/assets/gallery/A25I8942.jpg', alt: 'Haldi celebration', className: 'item-2' },
  { src: '/assets/gallery/A25I9111.jpg', alt: 'Mehendi celebration', className: 'item-3' },
  { src: '/assets/gallery/A25I9163.jpg', alt: 'Wedding celebration', className: 'item-4' },
  { src: '/assets/gallery/A25I9108.jpg', alt: 'Wedding moment', className: 'item-5' },
  { src: '/assets/gallery/A25I8862.jpg', alt: 'Wedding moment', className: 'item-6' },
  { src: '/assets/gallery/A25I8939.jpg', alt: 'Wedding moment', className: 'item-7' },
  { src: '/assets/gallery/A25I8946.jpg', alt: 'Wedding moment', className: 'item-8' },
];

function Gallery() {
  return (
    <section className="gallery-section section-paper">
      <div className="section-inner wide reveal">
        <p className="eyebrow">A FEW MOMENTS OF JOY</p>
        <h2>Our Celebration</h2>

        <div className="photo-collage">
          {GALLERY_IMAGES.map((img) => (
            <div key={img.className} className={`collage-item ${img.className}`}>
              <img
                src={img.src}
                alt={img.alt}
                loading="lazy"
                decoding="async"
                width="1800"
                height="1200"
                sizes="(max-width: 600px) 94vw, 575px"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Gallery;
