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
