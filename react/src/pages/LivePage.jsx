import React, { useEffect } from 'react';
import html from '../markup/live.html?raw';
import '../styles/style.css';
import '../styles/pages.css';
import initPages from '../scripts/pages-legacy.js';

export default function LivePage() {
  useEffect(() => {
    document.title = 'Wedding Live | Bhuvan & Manasa';
    document.body.className = 'standalone-page live-page';
    initPages();
  }, []);

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
