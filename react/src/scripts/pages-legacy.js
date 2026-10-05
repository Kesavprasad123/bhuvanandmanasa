export default function initPages(){
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

  // Gallery background music is only allowed on the Photos tab
  const galleryMusicEl = document.getElementById('galleryMusic');
  if (galleryMusicEl) {
    if (selectedTab.dataset.albumTab === 'videos') {
      if (!galleryMusicEl.paused) {
        window.__galleryMusicWasPlaying = true;
        galleryMusicEl.pause();
      }
    } else if (selectedTab.dataset.albumTab === 'photos') {
      if (window.__galleryMusicWasPlaying) {
        window.__galleryMusicWasPlaying = false;
        galleryMusicEl.play().catch(() => {});
      }
    }
  }
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
  { src: '/assets/gallery/upright/A25I9462.jpg', alt: 'Pelli Koduku celebration', caption: '' },
  { src: '/assets/gallery/upright/A25I8942.jpg', alt: 'Haldi celebration', caption: '' },
  { src: '/assets/gallery/upright/A25I9111.jpg', alt: 'Mehendi celebration', caption: '' },
  { src: '/assets/gallery/A25I9163.jpg', alt: 'Wedding celebration', caption: '' },
  { src: '/assets/gallery/upright/A25I9108.jpg', alt: 'A wedding moment', caption: '' },
  { src: '/assets/gallery/upright/A25I8862.jpg', alt: 'Bhuvan and Manasa with family', caption: '' },
  { src: '/assets/gallery/upright/A25I8939.jpg', alt: 'A joyful wedding moment', caption: '' },
  { src: '/assets/gallery/A25I8946.jpg', alt: 'Bhuvan and Manasa with loved ones', caption: '' },
  { src: '/assets/gallery/upright/A25I8855-corrected.jpg', alt: 'A joyful celebration moment', caption: '' },
  { src: '/assets/gallery/upright/A25I8938-corrected.jpg', alt: 'Family togetherness', caption: '' },
  { src: '/assets/A25I9468.JPG', alt: 'Celebration portrait', caption: '' },
  { src: '/assets/A25I9471.JPG', alt: 'Wedding memories', caption: '' }
];

function getPhotoOrientationFromRatio(width, height) {
  if (!width || !height) return 'square';
  const ratio = width / height;
  if (ratio > 1.15) return 'landscape';
  if (ratio < 0.87) return 'portrait';
  return 'square';
}

function loadGalleryImage(item) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const width = image.naturalWidth;
      const height = image.naturalHeight;
      resolve({ ...item, width, height, ratio: width / height, orientation: getPhotoOrientationFromRatio(width, height) });
    };
    image.onerror = () => resolve({ ...item, width: 1, height: 1, ratio: 1, orientation: 'square' });
    image.src = item.src;
  });
}

function calculateCollageRows(items, width) {
  const gap = width < 520 ? 8 : 12;
  const minimumCardWidth = width < 520 ? 116 : 156;
  const maxItemsPerRow = Math.min(4, Math.max(1, Math.floor((width + gap) / (minimumCardWidth + gap))));
  const targetHeight = width < 520 ? 190 : width < 900 ? 235 : 270;
  const costs = Array(items.length + 1).fill(Infinity);
  const previous = Array(items.length + 1).fill(-1);
  costs[0] = 0;

  for (let end = 1; end <= items.length; end += 1) {
    const firstStart = Math.max(0, end - maxItemsPerRow);
    for (let start = firstStart; start < end; start += 1) {
      const rowItems = items.slice(start, end);
      const ratioTotal = rowItems.reduce((sum, item) => sum + item.ratio, 0);
      const rowHeight = (width - gap * (rowItems.length - 1)) / ratioTotal;
      const heightCost = Math.log(Math.max(rowHeight, 1) / targetHeight) ** 2;
      const singletonCost = rowItems.length === 1 && items.length > 1 ? 0.2 : 0;
      const extremeHeightCost = rowHeight < targetHeight * 0.62 || rowHeight > targetHeight * 1.55 ? 0.25 : 0;
      const cost = costs[start] + heightCost + singletonCost + extremeHeightCost;

      if (cost < costs[end]) {
        costs[end] = cost;
        previous[end] = start;
      }
    }
  }

  const rows = [];
  for (let end = items.length; end > 0;) {
    const start = previous[end];
    rows.unshift(items.slice(start, end));
    end = start;
  }
  return { rows, gap };
}

const dynamicCollage = document.getElementById('dynamicCollage');
const photoCount = document.querySelector('[data-gallery-count]');
const photoLightbox = document.querySelector('.photo-lightbox');
const lightboxImage = document.querySelector('.lightbox-image');
const lightboxCaption = document.querySelector('.lightbox-caption');
let collageItems = [];
let photoButtons = [];
let activePhotoIndex = 0;
let lastCollageWidth = 0;

if (photoCount) photoCount.textContent = String(galleryImages.length);

function showLightboxPhoto(index) {
  if (!photoButtons.length || !photoLightbox || !lightboxImage || !lightboxCaption) return;
  activePhotoIndex = (index + photoButtons.length) % photoButtons.length;
  const photo = photoButtons[activePhotoIndex];
  const image = photo.querySelector('img');
  lightboxImage.src = photo.dataset.photo;
  lightboxImage.alt = image.alt;
  lightboxCaption.textContent = photo.dataset.caption;
}

function createPhotoButton(item, index) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'album-photo dynamic-collage-item';
  button.dataset.photo = item.src;
  button.dataset.caption = item.caption;
  button.dataset.orientation = item.orientation;
  button.style.setProperty('--image-ratio', String(item.ratio));

  const image = document.createElement('img');
  image.src = item.src;
  image.alt = item.alt;
  image.loading = index < 4 ? 'eager' : 'lazy';
  image.decoding = 'async';

  const label = document.createElement('span');
  label.textContent = String(index + 1);

  button.append(image, label);
  return button;
}

function layoutDynamicCollage() {
  if (!dynamicCollage || !collageItems.length) return;
  const width = dynamicCollage.clientWidth;
  if (!width || Math.abs(width - lastCollageWidth) < 2) return;
  lastCollageWidth = width;

  const { rows, gap } = calculateCollageRows(collageItems, width);
  const fragment = document.createDocumentFragment();
  let imageIndex = 0;

  rows.forEach((rowItems) => {
    const row = document.createElement('div');
    row.className = 'collage-row';
    row.style.setProperty('--row-gap', `${gap}px`);
    row.style.gridTemplateColumns = rowItems.map((item) => `${item.ratio}fr`).join(' ');

    rowItems.forEach((item) => {
      row.append(createPhotoButton(item, imageIndex));
      imageIndex += 1;
    });
    fragment.append(row);
  });

  dynamicCollage.replaceChildren(fragment);
  photoButtons = [...dynamicCollage.querySelectorAll('.album-photo')];
}

if (dynamicCollage) {
  if (!galleryImages.length) {
    dynamicCollage.innerHTML = '<p class="album-empty">No photos added yet.</p>';
  } else {
    Promise.all(galleryImages.map(loadGalleryImage)).then((items) => {
      collageItems = items;
      layoutDynamicCollage();
    });

    if ('ResizeObserver' in window) {
      const collageObserver = new ResizeObserver(layoutDynamicCollage);
      collageObserver.observe(dynamicCollage);
    } else {
      window.addEventListener('resize', layoutDynamicCollage);
    }

    dynamicCollage.addEventListener('click', (event) => {
      const photo = event.target.closest('.album-photo');
      if (!photo) return;
      showLightboxPhoto(photoButtons.indexOf(photo));
      photoLightbox?.showModal();
    });
  }
}

document.querySelector('.lightbox-close')?.addEventListener('click', () => photoLightbox?.close());
document.querySelector('.lightbox-previous')?.addEventListener('click', () => showLightboxPhoto(activePhotoIndex - 1));
document.querySelector('.lightbox-next')?.addEventListener('click', () => showLightboxPhoto(activePhotoIndex + 1));
photoLightbox?.addEventListener('click', (event) => {
  if (event.target === photoLightbox) photoLightbox.close();
});
photoLightbox?.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') showLightboxPhoto(activePhotoIndex - 1);
  if (event.key === 'ArrowRight') showLightboxPhoto(activePhotoIndex + 1);
  if (event.key === 'Escape') {
    event.preventDefault();
    photoLightbox.close();
  }
});

const galleryVideos = [
  { src: '/assets/Bhuvan_Manasa_Wedding_Full_HD_1080p.mp4', type: 'video/mp4', title: 'Wedding Film' }
];
const videoGrid = document.getElementById('albumVideoGrid');
const videoEmptyState = document.getElementById('videoEmptyState');
const videoLightbox = document.querySelector('.video-lightbox');
const lightboxVideo = document.querySelector('.lightbox-video');

function openVideoLightbox(videoItem) {
  if (!videoLightbox || !lightboxVideo) return;
  const galleryMusicEl = document.getElementById('galleryMusic');
  if (galleryMusicEl && !galleryMusicEl.paused) {
    window.__galleryMusicWasPlaying = true; // resume it when back on Photos
    galleryMusicEl.pause();
  }
  const source = document.createElement('source');
  source.src = videoItem.src;
  source.type = videoItem.type || 'video/mp4';
  lightboxVideo.replaceChildren(source);
  lightboxVideo.load();
  videoLightbox.showModal();
  lightboxVideo.play().catch(() => {});
}

function closeVideoLightbox() {
  if (!videoLightbox || !lightboxVideo) return;
  lightboxVideo.pause();
  lightboxVideo.removeAttribute('src');
  lightboxVideo.replaceChildren();
  lightboxVideo.load();
  videoLightbox.close();
}

document.querySelector('.video-lightbox-close')?.addEventListener('click', closeVideoLightbox);
videoLightbox?.addEventListener('click', (event) => {
  if (event.target === videoLightbox) closeVideoLightbox();
});
videoLightbox?.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') { event.preventDefault(); closeVideoLightbox(); }
});

if (videoGrid && videoEmptyState) {
  videoEmptyState.hidden = galleryVideos.length > 0;
  galleryVideos.forEach((videoItem) => {
    const figure = document.createElement('figure');
    figure.className = 'album-video';

    const thumb = document.createElement('button');
    thumb.type = 'button';
    thumb.className = 'video-thumb';
    thumb.setAttribute('aria-label', `Play video: ${videoItem.title || 'Wedding film'}`);

    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';
    const source = document.createElement('source');
    source.src = videoItem.src;
    source.type = videoItem.type || 'video/mp4';
    video.append(source);

    const badge = document.createElement('span');
    badge.className = 'video-play-badge';
    badge.setAttribute('aria-hidden', 'true');
    badge.textContent = '▶';

    thumb.append(video, badge);
    thumb.addEventListener('click', () => openVideoLightbox(videoItem));

    const caption = document.createElement('figcaption');
    caption.textContent = videoItem.title;
    figure.append(thumb, caption);
    videoGrid.append(figure);
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

}
