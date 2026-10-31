import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
// Base site styles first, so page-scoped styles (accommodation.css) can
// override same-specificity rules such as the invitation's global `footer p`.
import './styles/index.css';
import App from './App';

const Accommodation = lazy(() => import('./components/Accommodation'));

// Lightweight path routing (no router dependency).
// Supports root domain (/accommodation), GitHub Pages repo subpath (/bhuvanandmanasa/accommodation),
// with or without trailing slash. Everything else renders the invitation.
const isAccommodation = /\/accommodation(?:\/|$)/i.test(window.location.pathname);
const Root = isAccommodation ? Accommodation : App;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#fbf3e9' }} />}>
      <Root />
    </Suspense>
  </React.StrictMode>
);
