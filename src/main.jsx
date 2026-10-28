import React from 'react';
import ReactDOM from 'react-dom/client';
// Base site styles first, so page-scoped styles (accommodation.css) can
// override same-specificity rules such as the invitation's global `footer p`.
import './styles/index.css';
import App from './App';
import Accommodation from './components/Accommodation';

// Lightweight path routing (no router dependency).
// /accommodation renders the stay page; everything else keeps the invitation.
const path = window.location.pathname
  .replace(/\/index\.html$/i, '')
  .replace(/\/+$/, '') || '/';
const Root = path.toLowerCase().startsWith('/accommodation') ? Accommodation : App;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
