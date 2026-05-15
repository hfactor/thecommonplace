let searchQuery = '';
let recFilter   = false;
let activePills = new Set();

const FILTER_FN = {
  'all':        () => true,
  'reading':    e => e.type === 'reading',
  'bookmarks':  e => e.type === 'bookmarks',
  'newsletter': e => e.type === 'newsletter',
};

const _base = (typeof BASE_PATH !== 'undefined' ? BASE_PATH : '/').replace(/\/$/, '');

const FILTER_TO_PATH = {
  reading:    _base + '/reading',
  bookmarks:  _base + '/bookmarks',
  newsletter: _base + '/newsletter',
};

const PATH_TO_FILTER = {
  [_base + '/reading']:    'reading',
  [_base + '/bookmarks']:  'bookmarks',
  [_base + '/newsletter']: 'newsletter',
};

function buildActiveFilter() {
  if (!activePills.size) { activeFilter = () => true; return; }
  const fns = [...activePills].map(id => FILTER_FN[id]).filter(Boolean);
  activeFilter = e => fns.some(fn => fn(e));
}

/* ─── Header filter ──────────────────────────────── */

function buildHdrFilterItems() {
  const panel = document.getElementById('hdrFilterPanel');
  if (!panel || typeof VIEWS_CFG === 'undefined') return;

  VIEWS_CFG.forEach(v => {
    if (v.id === 'all') return;
    const btn = document.createElement('button');
    btn.className = 'hdr-filter-item';
    btn.dataset.id = v.id;
    btn.textContent = v.label;
    btn.addEventListener('click', () => { togglePill(v.id); closeHdrFilter(); });
    panel.appendChild(btn);
  });

  const rec = document.createElement('button');
  rec.className = 'hdr-filter-item';
  rec.id = 'hdrRecFilterItem';
  rec.textContent = '✦ Recommended';
  rec.addEventListener('click', () => { toggleRec(); closeHdrFilter(); });
  panel.appendChild(rec);
}

function toggleHdrFilter() {
  const panel   = document.getElementById('hdrFilterPanel');
  const overlay = document.getElementById('hdrFilterOverlay');
  const btn     = document.getElementById('hdrFilterBtn');
  if (!panel) return;
  const open = panel.classList.toggle('open');
  overlay?.classList.toggle('open', open);
  btn?.setAttribute('aria-expanded', open);
}

function closeHdrFilter() {
  document.getElementById('hdrFilterPanel')?.classList.remove('open');
  document.getElementById('hdrFilterOverlay')?.classList.remove('open');
  document.getElementById('hdrFilterBtn')?.setAttribute('aria-expanded', 'false');
}

function _updateHdrLabel() {
  const label = document.getElementById('hdrFilterLabel');
  const btn   = document.getElementById('hdrFilterBtn');
  if (!label) return;

  const allLabel = (typeof VIEWS_CFG !== 'undefined') ? (VIEWS_CFG.find(v => v.id === 'all')?.label || 'Everything') : 'Everything';

  let text = allLabel;
  let filtered = false;
  if (recFilter) {
    text = `${allLabel} / ✦ Recommended`;
    filtered = true;
  } else if (activePills.size === 1) {
    const id  = [...activePills][0];
    const cfg = (typeof VIEWS_CFG !== 'undefined') ? VIEWS_CFG.find(v => v.id === id) : null;
    if (cfg) { text = `${allLabel} / ${cfg.label}`; filtered = true; }
  }
  label.textContent = text;
  btn?.classList.toggle('active', filtered);

  // Sync header filter item active states
  document.querySelectorAll('.hdr-filter-item[data-id]').forEach(b => {
    b.classList.toggle('active', activePills.has(b.dataset.id));
  });
  const recItem = document.getElementById('hdrRecFilterItem');
  if (recItem) recItem.classList.toggle('active', recFilter);
}

/* ─── FAB filter (kept for backwards compat, hidden on everything) */

function buildFilterItems() {
  const container = document.getElementById('fabFilterItems');
  if (!container || !VIEWS_CFG) return;

  VIEWS_CFG.forEach(v => {
    if (v.id === 'all') return;
    const btn = document.createElement('button');
    btn.className = 'fab-filter-item';
    btn.dataset.id = v.id;
    btn.textContent = v.label;
    btn.addEventListener('click', () => togglePill(v.id));
    container.appendChild(btn);
  });

  const rec = document.createElement('button');
  rec.className = 'fab-filter-item';
  rec.id = 'recFilterItem';
  rec.textContent = '✦ Recommended';
  rec.addEventListener('click', () => toggleRec());
  container.appendChild(rec);

  _syncFilterItems();
}

function _syncFilterItems() {
  document.querySelectorAll('.fab-filter-item[data-id]').forEach(btn => {
    btn.classList.toggle('active', activePills.has(btn.dataset.id));
  });
  const recItem = document.getElementById('recFilterItem');
  if (recItem) recItem.classList.toggle('active', recFilter);
  _updateHdrLabel();
}

function togglePill(id) {
  if (activePills.has(id)) {
    activePills.clear();
  } else {
    activePills.clear();
    activePills.add(id);
  }
  recFilter = false;
  _syncFilterItems();
  buildActiveFilter();
  _syncUrl();
  rebuild();
}

function toggleRec() {
  recFilter = !recFilter;
  if (recFilter) activePills.clear();
  _syncFilterItems();
  buildActiveFilter();
  _syncUrl();
  rebuild();
}

function clearFilter() {
  activePills.clear();
  recFilter = false;
  _syncFilterItems();
  buildActiveFilter();
  _syncUrl();
  rebuild();
}

function _syncUrl() {
  if (activePills.size === 1) {
    const id   = [...activePills][0];
    const path = FILTER_TO_PATH[id];
    if (path) { history.replaceState({filter: id}, '', path); return; }
  }
  history.replaceState({}, '', _base + '/everything');
}

document.addEventListener('DOMContentLoaded', () => {
  buildFilterItems();
  // Show header filter only on everything/sub-everything pages
  if (document.getElementById('mWrap')) {
    const hdrFilter = document.getElementById('hdrFilter');
    if (hdrFilter) hdrFilter.classList.add('visible');
    buildHdrFilterItems();
    _updateHdrLabel();
  }
});
