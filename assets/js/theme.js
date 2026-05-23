'use strict';

const ICO = {
  ext:    `<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 8L8 2M8 2H4M8 2V6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  search: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" stroke-width="1.3"/><path d="M10 10L13 13" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>`,
  grid:   `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="1" width="5" height="5" rx="1"/><rect x="8" y="1" width="5" height="5" rx="1"/><rect x="1" y="8" width="5" height="5" rx="1"/><rect x="8" y="8" width="5" height="5" rx="1"/></svg>`,
  list:   `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><line x1="1.5" y1="3.5" x2="12.5" y2="3.5"/><line x1="1.5" y1="7" x2="12.5" y2="7"/><line x1="1.5" y1="10.5" x2="12.5" y2="10.5"/></svg>`,
  moon: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M11.5 9.5A5.5 5.5 0 0 1 4.5 2.5a5.5 5.5 0 1 0 7 7z"/><circle cx="11.5" cy="2" r="0.7" fill="currentColor" stroke="none"/><circle cx="13" cy="5.5" r="0.5" fill="currentColor" stroke="none"/></svg>`,
  sun:  `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><circle cx="7" cy="7" r="2.5"/><line x1="7" y1="1" x2="7" y2="2.5"/><line x1="7" y1="11.5" x2="7" y2="13"/><line x1="1" y1="7" x2="2.5" y2="7"/><line x1="11.5" y1="7" x2="13" y2="7"/><line x1="3.05" y1="3.05" x2="4.1" y2="4.1"/><line x1="9.9" y1="9.9" x2="10.95" y2="10.95"/><line x1="9.9" y1="4.1" x2="10.95" y2="3.05"/><line x1="3.05" y1="10.95" x2="4.1" y2="9.9"/></svg>`,
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
  const btn = document.getElementById('fabViewBtn');
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

  const themeBtn = document.getElementById('fabThemeBtn');
  if (themeBtn) {
    themeBtn.innerHTML = icon;
    themeBtn.dataset.tooltip = theme === 'ink' ? 'Light mode' : 'Dark mode';
  }

  const sfTheme = document.querySelector('.sf-theme');
  if (sfTheme) sfTheme.innerHTML = icon;

  const viewBtn = document.getElementById('fabViewBtn');
  if (viewBtn) {
    viewBtn.innerHTML = vm === 'list' ? ICO.grid : ICO.list;
    viewBtn.dataset.tooltip = vm === 'list' ? 'Grid view' : 'List view';
  }

  const exploreBtn = document.getElementById('fabExploreBtn');
  if (exploreBtn) {
    exploreBtn.innerHTML = ICO.explore;
    exploreBtn.dataset.tooltip = 'Explore';
  }
}

// Alias so main.js can call this after setViewMode
function updateFabState() { updateFabIcons(); }

// Append ref=hiran.in to all external links
function withRef(url) {
  if (!url || !url.startsWith('http')) return url || '#';
  return url + (url.includes('?') ? '&' : '?') + 'ref=hiran.in';
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
