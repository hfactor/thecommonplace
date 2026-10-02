'use strict';

let searchIndex = null;
let searchIndexPromise = null;
let searchActiveIdx = -1;

function loadSearchIndex() {
  if (searchIndexPromise) return searchIndexPromise;
  searchIndexPromise = fetch('/search-index.json')
    .then(res => res.json())
    .then(data => { searchIndex = data; return data; })
    .catch(() => { searchIndex = []; return searchIndex; });
  return searchIndexPromise;
}

function openSearch() {
  const overlay = document.getElementById('searchOverlay');
  if (!overlay) return;
  overlay.classList.add('open');
  // A fast typist can enter a query before this fetch resolves — the
  // 'input' listener will have already bailed out (no searchIndex yet)
  // and won't fire again on its own, so re-render once loading finishes.
  loadSearchIndex().then(renderSearchResults);
  const input = document.getElementById('searchInput');
  input.value = '';
  document.getElementById('searchResults').innerHTML = '';
  searchActiveIdx = -1;
  const home = document.getElementById('searchHome');
  if (home) home.hidden = false;
  setMonthShortcuts();
  // List/Card only makes sense on pages that actually have a feed.
  const viewAction = document.getElementById('viewAction');
  if (viewAction && !viewAction.dataset.listOnly) viewAction.hidden = !(document.getElementById('lView') || document.getElementById('cardView'));
  if (typeof updateFabIcons === 'function') updateFabIcons();
  const hint = document.getElementById('searchHintKey');
  if (hint) hint.textContent = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? '\u2318K' : 'Ctrl K';
  setTimeout(() => input.focus(), 10);
}

// "This month" / "Last month" aren't pages, they're one-click searches that
// fill the box with a month the existing time-jump matching already understands.
function setMonthShortcuts() {
  const now = new Date();
  [['searchThisMonth', 0], ['searchLastMonth', -1]].forEach(([id, offset]) => {
    const el = document.getElementById(id);
    if (!el) return;
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const label = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    el.dataset.query = label.toLowerCase();
    el.querySelector('.search-result-meta').textContent = label;
  });
}

function closeSearch() {
  const overlay = document.getElementById('searchOverlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  searchActiveIdx = -1;
}

const SEARCH_MONTHS = MONTHS.map(m => m.toLowerCase());

const searchTypeLabel = id => (typeof TYPES_CFG !== 'undefined' && (TYPES_CFG.find(t => t.id === id) || {}).label) || id;

// title/extra: broad substring match (expected for free text).
// type/month/year: prefix match only — an infix hit ("ma" inside "bookmarks")
// isn't what "type as a search value" means, and short month prefixes are
// surfaced as suggestions instead of silently exploding the result list.
function itemMatches(it, q) {
  const hay = [it.title, it.extra].filter(Boolean).join(' ').toLowerCase();
  if (hay.includes(q)) return true;
  if (/^[a-z]/.test(q) && searchTypeLabel(it.type).toLowerCase().startsWith(q)) return true;

  const d = new Date(it.date);
  if (isNaN(d)) return false;
  const monthName = SEARCH_MONTHS[d.getMonth()];
  if (/^[a-z]+$/.test(q) && q.length >= 3 && monthName.startsWith(q)) return true;
  if (/^\d+$/.test(q) && String(d.getFullYear()).startsWith(q)) return true;
  if (`${monthName} ${d.getFullYear()}`.startsWith(q)) return true;
  return false;
}

// Suggestions: typed prefix of a type name or month name, or a year prefix —
// surfaced as one-click "jump" values rather than a permanent list of chips.
function buildSuggestions(q) {
  if (!q || !/^[a-z0-9]+$/.test(q)) return [];
  const out = [];

  if (typeof TYPES_CFG !== 'undefined' && searchIndex) {
    const presentTypes = new Set(searchIndex.map(it => it.type));
    TYPES_CFG.filter(t => presentTypes.has(t.id) && t.label.toLowerCase().startsWith(q))
      .slice(0, 3)
      .forEach(t => out.push({ label: t.label, value: t.label.toLowerCase(), meta: 'Type' }));
  }

  if (searchIndex && /^[a-z]+$/.test(q)) {
    const monthIdxs = SEARCH_MONTHS.reduce((acc, m, i) => { if (m.startsWith(q)) acc.push(i); return acc; }, []);
    if (monthIdxs.length) {
      const pairs = new Set(); // "monthIdx-year"
      searchIndex.forEach(it => {
        const d = new Date(it.date);
        if (!isNaN(d) && monthIdxs.includes(d.getMonth())) pairs.add(`${d.getMonth()}-${d.getFullYear()}`);
      });
      Array.from(pairs)
        .map(p => { const [mi, y] = p.split('-').map(Number); return { mi, y }; })
        .sort((a, b) => b.y - a.y || a.mi - b.mi)
        .slice(0, 3)
        .forEach(({ mi, y }) => out.push({ label: `${MONTHS[mi]} ${y}`, value: `${MONTHS[mi].toLowerCase()} ${y}`, meta: 'Timeline' }));
    }
  }

  if (searchIndex && /^\d{1,4}$/.test(q)) {
    const years = new Set();
    searchIndex.forEach(it => { const d = new Date(it.date); if (!isNaN(d)) years.add(d.getFullYear()); });
    Array.from(years).filter(y => String(y).startsWith(q)).sort((a, b) => b - a).slice(0, 3)
      .forEach(y => out.push({ label: String(y), value: String(y), meta: 'Timeline' }));
  }

  return out;
}

function renderSearchResults() {
  const resultsEl = document.getElementById('searchResults');
  if (!resultsEl) return;
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
  const home = document.getElementById('searchHome');
  if (home) home.hidden = !!q;

  if (!q) { resultsEl.innerHTML = ''; searchActiveIdx = -1; return; }
  if (!searchIndex) return;

  const suggestions = buildSuggestions(q);
  const items = searchIndex
    .filter(it => itemMatches(it, q))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 30);

  searchActiveIdx = -1;

  if (!suggestions.length && !items.length) {
    resultsEl.innerHTML = `<div class="search-empty">Nothing found.</div>`;
    return;
  }

  let html = '';
  if (suggestions.length) {
    html += `<div class="search-suggestions">${suggestions.map(s =>
      `<button type="button" class="search-suggestion" data-value="${s.value}"><span>${s.label}</span><span class="search-suggestion-meta">${s.meta}</span></button>`
    ).join('')}</div>`;
  }
  if (items.length) {
    html += items.map(it => `<a class="search-result" href="${it.permalink}">
        <span class="search-result-title">${it.title}</span>
        <span class="search-result-meta">${searchTypeLabel(it.type)}</span>
      </a>`).join('');
  }
  resultsEl.innerHTML = html;

  resultsEl.querySelectorAll('.search-suggestion').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById('searchInput');
      input.value = btn.dataset.value;
      renderSearchResults();
      input.focus();
    });
  });
}

// Arrow keys walk whichever list is on screen: the start screen's pages and
// preferences when the box is empty, search results once something is typed.
function searchNavNodes() {
  const sel = '#searchHome:not([hidden]) .search-result, #searchResults .search-result';
  return Array.from(document.querySelectorAll(sel)).filter(n => n.offsetParent !== null);
}

function setSearchActive(idx) {
  const nodes = searchNavNodes();
  nodes.forEach(n => n.classList.remove('kb-active'));
  if (idx >= 0 && idx < nodes.length) {
    nodes[idx].classList.add('kb-active');
    nodes[idx].scrollIntoView({ block: 'nearest' });
  }
  searchActiveIdx = idx;
}

document.addEventListener('keydown', e => {
  const overlay = document.getElementById('searchOverlay');
  const isOpen = overlay && overlay.classList.contains('open');

  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    isOpen ? closeSearch() : openSearch();
    return;
  }

  if (!isOpen) return;

  if (e.key === 'Escape') { closeSearch(); return; }
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    setSearchActive(Math.min(searchActiveIdx + 1, searchNavNodes().length - 1));
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    setSearchActive(Math.max(searchActiveIdx - 1, 0));
  } else if (e.key === 'Enter') {
    const nodes = searchNavNodes();
    if (searchActiveIdx >= 0 && nodes[searchActiveIdx]) {
      e.preventDefault();
      nodes[searchActiveIdx].click();
    }
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('searchOverlay');
  const input = document.getElementById('searchInput');
  if (!overlay || !input) return;

  overlay.addEventListener('click', e => { if (e.target === overlay) closeSearch(); });
  input.addEventListener('input', renderSearchResults);
  document.querySelectorAll('#searchHome [data-query]').forEach(btn => {
    btn.addEventListener('click', () => {
      input.value = btn.dataset.query;
      renderSearchResults();
      input.focus();
    });
  });
});
