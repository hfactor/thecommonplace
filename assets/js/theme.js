'use strict';

const ICO = {
  ext:    `<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><polyline points="5.5,1 9,1 9,4.5"/><line x1="9" y1="1" x2="3.5" y2="6.5"/><polyline points="4,3 1,3 1,9 7,9 7,6"/></svg>`,
  search: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4" stroke="currentColor" stroke-width="1.5"/><line x1="9" y1="9" x2="13" y2="13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  grid:   `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="1" width="5" height="12" rx="1.5"/><rect x="8" y="1" width="5" height="12" rx="1.5"/></svg>`,
  list:   `<svg width="14" height="13" viewBox="0 0 14 13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="1" y1="2" x2="4.5" y2="2"/><line x1="6.5" y1="2" x2="13" y2="2"/><line x1="1" y1="6.5" x2="4.5" y2="6.5"/><line x1="6.5" y1="6.5" x2="13" y2="6.5"/><line x1="1" y1="11" x2="4.5" y2="11"/><line x1="6.5" y1="11" x2="13" y2="11"/></svg>`,
  moon: `◐`,
  sun:  `◐`,
  explore: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9L7 11.5L12 9"/><path d="M2 6.5L7 9L12 6.5"/><path d="M7 2.5L12 5L7 7.5L2 5L7 2.5Z"/></svg>`,
  random: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><rect x="1.5" y="1.5" width="11" height="11" rx="2"/><circle cx="4.5" cy="4.5" r="0.8" fill="currentColor" stroke="none"/><circle cx="9.5" cy="4.5" r="0.8" fill="currentColor" stroke="none"/><circle cx="7" cy="7" r="0.8" fill="currentColor" stroke="none"/><circle cx="4.5" cy="9.5" r="0.8" fill="currentColor" stroke="none"/><circle cx="9.5" cy="9.5" r="0.8" fill="currentColor" stroke="none"/></svg>`,
};

const THEMES = ['chalk', 'ink'];

function setTheme(name) {
  document.documentElement.setAttribute('data-theme', name);
  localStorage.setItem('theme', name);
  updateFabIcons();
}

function fabToggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'chalk';
  setTheme(current === 'ink' ? 'chalk' : 'ink');
}

function fabToggleView() {
  const btn = document.getElementById('phViewBtn');
  if (btn?.classList.contains('disabled')) return;
  if (typeof setViewMode === 'undefined') return;
  const next = viewMode === 'list' ? 'card' : 'list';
  setViewMode(next);
  updateFabIcons();
}


function updateFabIcons() {
  const theme = document.documentElement.getAttribute('data-theme') || 'chalk';
  const vm    = typeof viewMode !== 'undefined' ? viewMode : 'card';
  const icon  = theme === 'ink' ? ICO.moon : ICO.sun;

  const sfTheme = document.querySelector('.sf-theme');
  if (sfTheme) sfTheme.innerHTML = icon;

  // Sync segmented toggle(s) — bar and FAB dock both render one on section pages
  const mode = vm === 'list' ? 'list' : 'card';
  document.querySelectorAll('.sh-view-toggle').forEach(toggle => {
    toggle.dataset.mode = mode;
    toggle.querySelectorAll('.sh-vt-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
  });
}

// Alias so main.js can call this after setViewMode
function updateFabState() { updateFabIcons(); }

// Append a tracking param to all external links.
// Substack reserves `ref` for its own referral-attribution system — an
// arbitrary value there breaks its subscribe flow — so Substack links get
// the standard, non-reserved `utm_source` instead.
function withRef(url) {
  if (!url || !url.startsWith('http')) return url || '#';
  const param = url.includes('substack.com') ? 'utm_source=hiran.in' : 'ref=hiran.in';
  return url + (url.includes('?') ? '&' : '?') + param;
}

function subscribeNewsletter(e) {
  e.preventDefault();
  const email = e.target.querySelector('input[type="email"]').value.trim();
  if (!email) return;
  window.open('https://hiran.substack.com?email=' + encodeURIComponent(email) + '&utm_source=hiran.in', '_blank');
}

function copyEmail(el) {
  navigator.clipboard.writeText('hiran.v@gmail.com').then(() => {
    const tip = el.parentElement.querySelector('.home-email-tip');
    tip.classList.add('show');
    setTimeout(() => tip.classList.remove('show'), 1800);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // Migrate old theme values
  const saved = localStorage.getItem('theme');
  if (saved === 'light' || saved === 'dark') {
    setTheme(saved === 'dark' ? 'ink' : 'chalk');
  } else if (saved && THEMES.includes(saved)) {
    setTheme(saved);
  }

  updateFabIcons();

});
