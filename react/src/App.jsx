import React from 'react';
import InvitationPage from './pages/InvitationPage.jsx';
import GalleryPage from './pages/GalleryPage.jsx';
import LivePage from './pages/LivePage.jsx';

export default function App() {
  const path = window.location.pathname;
  if (path.startsWith('/gallery')) return <GalleryPage />;
  if (path.startsWith('/live')) return <LivePage />;
  return <InvitationPage />;
}
