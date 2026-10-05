import React, { useEffect } from 'react';
import html from '../markup/gallery.html?raw';
import '../styles/style.css';
import '../styles/pages.css';
import initPages from '../scripts/pages-legacy.js';
import initGalleryMusic from '../scripts/galleryMusic.js';

export default function GalleryPage() {
  useEffect(() => {
    document.title = 'Celebration Album | Bhuvan & Manasa';
    document.body.className = 'standalone-page gallery-page';
    initPages();
    initGalleryMusic();
  }, []);

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
