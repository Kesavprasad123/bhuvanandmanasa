const themeButtons = document.querySelectorAll('.theme-toggle');

function applyPageTheme(isDark) {
  document.body.classList.toggle('dark-theme', isDark);
  themeButtons.forEach((button) => {
    button.textContent = isDark ? '☀' : '☾';
    button.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
    button.setAttribute('aria-pressed', String(isDark));
  });
}

applyPageTheme(localStorage.getItem('weddingTheme') === 'dark');
themeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const isDark = !document.body.classList.contains('dark-theme');
    applyPageTheme(isDark);
    localStorage.setItem('weddingTheme', isDark ? 'dark' : 'light');
  });
});

const albumTabs = [...document.querySelectorAll('[data-album-tab]')];

function selectAlbumTab(selectedTab, moveFocus = false) {
  albumTabs.forEach((tab) => {
    const isSelected = tab === selectedTab;
    tab.setAttribute('aria-selected', String(isSelected));
    tab.tabIndex = isSelected ? 0 : -1;
    if (isSelected) {
      document.getElementById(tab.getAttribute('aria-controls')).hidden = false;
    } else {
      document.getElementById(tab.getAttribute('aria-controls')).hidden = true;
    }
  });

  if (moveFocus) selectedTab.focus();
}

albumTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectAlbumTab(tab));
  tab.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    const nextIndex = (index + direction + albumTabs.length) % albumTabs.length;
    selectAlbumTab(albumTabs[nextIndex], true);
  });
});

const galleryImages = [
  { src: '/assets/gallery/A25I9462.jpg', alt: 'Pelli Koduku celebration', caption: 'Pelli Koduku' },
  { src: '/assets/gallery/A25I8942.jpg', alt: 'Haldi celebration', caption: 'Haldi celebration' },
  { src: '/assets/gallery/A25I9111.jpg', alt: 'Mehendi celebration', caption: 'Mehendi celebration' },
  { src: '/assets/gallery/A25I9163.jpg', alt: 'Wedding celebration', caption: 'Wedding celebration' },
  { src: '/assets/gallery/A25I9108.jpg', alt: 'A wedding moment', caption: 'A wedding moment' },
  { src: '/assets/gallery/A25I8862.jpg', alt: 'Bhuvan and Manasa with family', caption: 'With family' },
  { src: '/assets/gallery/A25I8939.jpg', alt: 'A joyful wedding moment', caption: 'A joyful moment' },
  { src: '/assets/gallery/A25I8946.jpg', alt: 'Bhuvan and Manasa with loved ones', caption: 'Together with loved ones' },
  { src: '/assets/A25I8855.JPG', alt: 'A joyful celebration moment', caption: 'A joyful celebration moment' },
  { src: '/assets/A25I8938.JPG', alt: 'Family togetherness', caption: 'Family togetherness' },
  { src: '/assets/A25I9468.JPG', alt: 'Celebration portrait', caption: 'Celebration portrait' },
  { src: '/assets/A25I9471.JPG', alt: 'Wedding memories', caption: 'Wedding memories' }
];

function getPhotoOrientationFromRatio(width, height) {
  if (!width || !height) return 'square';
  const ratio = width / height;
  if (ratio > 1.2) return 'landscape';
  if (ratio < 0.85) return 'portrait';
  return 'square';
}

function getAutoLayoutSpan(imageRatio, index, total) {
  const orientation = getPhotoOrientationFromRatio(imageRatio, 1);

  if (total === 1) return { x: 1, y: 1 };
  if (total === 2) return { x: 1, y: 1 };
  if (total === 3) {
    if (index === 0) return { x: 2, y: 1 };
    return { x: 1, y: 1 };
  }
  if (total <= 4) {
    if (index === 0) return { x: 2, y: 1 };
    return { x: 1, y: 1 };
  }

  if (orientation === 'portrait') return { x: 1, y: 2 };
  if (orientation === 'landscape') return { x: 2, y: 1 };
  return { x: 1, y: 1 };
}

function getColumnsForTotal(total) {
  if (total <= 1) return 1;
  if (total <= 2) return 2;
  if (total <= 6) return 3;
  return 4;
}

function renderDynamicCollage(images) {
  const target = document.getElementById('dynamicCollage');
  if (!target) return;

  target.innerHTML = '';
  if (!images.length) {
    target.innerHTML = '<p class="album-empty">No photos added yet.</p>';
    return;
  }

  const columns = getColumnsForTotal(images.length);
  target.style.setProperty('--dynamic-cols', String(columns));

  const requests = images.map((item) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ ...item, ratio: img.naturalWidth / img.naturalHeight || 1 });
    img.onerror = () => resolve({ ...item, ratio: 1 });
    img.src = item.src;
  }));

  Promise.all(requests).then((items) => {
    items.forEach((item, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'album-photo dynamic-collage-item';
      button.dataset.photo = item.src;
      button.dataset.caption = item.caption;
      button.style.setProperty('--image-ratio', String(item.ratio || 1));

      const span = getAutoLayoutSpan(item.ratio || 1, index, items.length);
      button.style.setProperty('--span-x', String(span.x));
      button.style.setProperty('--span-y', String(span.y));

      const img = document.createElement('img');
      img.src = item.src;
      img.alt = item.alt;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.style.objectFit = 'contain';

      const label = document.createElement('span');
      label.textContent = String(index + 1);

      button.append(img, label);
      target.append(button);
    });

    const photoButtons = [...document.querySelectorAll('.album-photo')];
    const lightbox = document.querySelector('.photo-lightbox');
    const lightboxImage = document.querySelector('.lightbox-image');
    const lightboxCaption = document.querySelector('.lightbox-caption');
    let activePhotoIndex = 0;

    function showLightboxPhoto(index) {
      if (!photoButtons.length || !lightbox || !lightboxImage || !lightboxCaption) return;
      activePhotoIndex = (index + photoButtons.length) % photoButtons.length;
      const photo = photoButtons[activePhotoIndex];
      const image = photo.querySelector('img');
      lightboxImage.src = photo.dataset.photo;
      lightboxImage.alt = image.alt;
      lightboxCaption.textContent = photo.dataset.caption;
      lightboxImage.style.transform = 'none';
    }

    if (lightbox && photoButtons.length) {
      photoButtons.forEach((photo, index) => {
        photo.addEventListener('click', () => {
          showLightboxPhoto(index);
          lightbox.showModal();
        });
      });

      const closeButton = document.querySelector('.lightbox-close');
      const previousButton = document.querySelector('.lightbox-previous');
      const nextButton = document.querySelector('.lightbox-next');

      closeButton?.addEventListener('click', () => lightbox.close());
      previousButton?.addEventListener('click', () => showLightboxPhoto(activePhotoIndex - 1));
      nextButton?.addEventListener('click', () => showLightboxPhoto(activePhotoIndex + 1));
      lightbox.addEventListener('click', (event) => {
        if (event.target === lightbox) lightbox.close();
      });
      lightbox.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') showLightboxPhoto(activePhotoIndex - 1);
        if (event.key === 'ArrowRight') showLightboxPhoto(activePhotoIndex + 1);
        if (event.key === 'Escape') {
          event.preventDefault();
          lightbox.close();
        }
      });
    }
  });
}

renderDynamicCollage(galleryImages);

const galleryVideos = [];
const videoGrid = document.getElementById('albumVideoGrid');
const videoEmptyState = document.getElementById('videoEmptyState');

if (videoGrid && videoEmptyState) {
  videoEmptyState.hidden = galleryVideos.length > 0;
  galleryVideos.forEach((videoItem) => {
    const figure = document.createElement('figure');
    figure.className = 'album-video';
    const video = document.createElement('video');
    video.controls = true;
    video.playsInline = true;
    video.preload = 'metadata';
    const source = document.createElement('source');
    source.src = videoItem.src;
    source.type = videoItem.type || 'video/mp4';
    video.append(source);
    const caption = document.createElement('figcaption');
    caption.textContent = videoItem.title;
    figure.append(video, caption);
    videoGrid.append(figure);
  });
}

const lightbox = document.querySelector('.photo-lightbox');
const photoButtons = [...document.querySelectorAll('.album-photo')];
const lightboxImage = document.querySelector('.lightbox-image');
const lightboxCaption = document.querySelector('.lightbox-caption');
let activePhotoIndex = 0;

function showLightboxPhoto(index) {
  if (!photoButtons.length) return;
  activePhotoIndex = (index + photoButtons.length) % photoButtons.length;
  const photo = photoButtons[activePhotoIndex];
  const image = photo.querySelector('img');
  lightboxImage.src = photo.dataset.photo;
  lightboxImage.alt = image.alt;
  lightboxImage.classList.toggle('is-rotated', photo.dataset.rotation === '-90');
  lightboxCaption.textContent = photo.dataset.caption;
}

if (lightbox && photoButtons.length) {
  photoButtons.forEach((photo, index) => {
    photo.addEventListener('click', () => {
      showLightboxPhoto(index);
      lightbox.showModal();
    });
  });

  document.querySelector('.lightbox-close').addEventListener('click', () => lightbox.close());
  document.querySelector('.lightbox-previous').addEventListener('click', () => showLightboxPhoto(activePhotoIndex - 1));
  document.querySelector('.lightbox-next').addEventListener('click', () => showLightboxPhoto(activePhotoIndex + 1));
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) lightbox.close();
  });
  lightbox.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') showLightboxPhoto(activePhotoIndex - 1);
    if (event.key === 'ArrowRight') showLightboxPhoto(activePhotoIndex + 1);
    if (event.key === 'Escape') {
      event.preventDefault();
      lightbox.close();
    }
  });
}

function youtubeVideoId(value) {
  if (!value) return '';

  try {
    const url = new URL(value);
    const hostname = url.hostname.replace(/^www\./, '');
    if (hostname === 'youtu.be') return url.pathname.split('/').filter(Boolean)[0] || '';
    if (hostname !== 'youtube.com' && hostname !== 'm.youtube.com' && hostname !== 'youtube-nocookie.com') return '';
    const queryId = url.searchParams.get('v');
    if (queryId) return queryId;
    const pathParts = url.pathname.split('/').filter(Boolean);
    const markerIndex = pathParts.findIndex((part) => ['live', 'embed', 'shorts'].includes(part));
    return markerIndex >= 0 ? pathParts[markerIndex + 1] || '' : '';
  } catch {
    return '';
  }
}

const liveStage = document.getElementById('liveStage');
const liveFrame = document.getElementById('liveFrame');
const liveWaiting = document.getElementById('liveWaiting');
const youtubeWatchLink = document.getElementById('youtubeWatchLink');

if (liveStage && liveFrame && liveWaiting && youtubeWatchLink) {
  const videoId = youtubeVideoId(liveStage.dataset.youtubeLiveUrl);
  if (videoId) {
    liveFrame.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?rel=0`;
    liveFrame.hidden = false;
    liveWaiting.hidden = true;
    youtubeWatchLink.href = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
    youtubeWatchLink.hidden = false;
  }
}
