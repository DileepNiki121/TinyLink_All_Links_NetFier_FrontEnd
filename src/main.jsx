// src/main.jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import { loadLinks } from './storage';

async function tryRedirect() {
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
  if (!path) return false;
  const reserved = ['index.html','favicon.ico','robots.txt'];
  if (reserved.includes(path)) return false;

  try {
    const links = await loadLinks();
    const found = (Array.isArray(links) ? links : []).find(l => l.code === path);
    if (found && found.target_url) {
      window.location.replace(found.target_url);
      return true;
    }
  // eslint-disable-next-line no-unused-vars
  } catch (err) {
    // ignore
  }
  return false;
}

tryRedirect().then(did => {
  if (!did) createRoot(document.getElementById('root')).render(<App />);
});
