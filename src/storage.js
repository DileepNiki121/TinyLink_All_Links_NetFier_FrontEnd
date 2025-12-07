// src/storage.js
// Frontend-only storage using localStorage and a public seed file (public/links.json)
const STORAGE_KEY = 'all_links_netfier_links_v1';

export async function loadLinks() {
  // Try to load from localStorage, otherwise fetch seed from public/links.json
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('loadLinks: localStorage parse error', err);
  }

  // fallback: fetch seed
  try {
    const res = await fetch('/links.json', { cache: 'no-cache' });
    if (res.ok) {
      const seed = await res.json();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
  } catch (err) {
    console.warn('loadLinks: seed fetch failed', err);
  }
  return [];
}

export function saveLinks(arr) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

export function generateCode(len = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}
