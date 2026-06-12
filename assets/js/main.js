// DATA and PAGE_CONTENT are injected by Hugo via list.html

const S = {};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const kFull  = k => { const [y,m] = k.split('-'); return `${MONTHS[+m-1]} ${y}`; };

let viewMode = 'card';
let filteredKeys = [];
let currentIdx = 0;

const isRec = e => e.recommended;
const typeCfg = type => (typeof TYPES_CFG !== 'undefined' ? TYPES_CFG : []).find(t => t.id === type) || {};

function entryMatches(e) {
  // Type + field filters from __LISTING__ (set per page)
  if (typeof window.__LISTING__ !== 'undefined') {
    const L = window.__LISTING__;
    if (L.type && e.type !== L.type) return false;
    // On unfiltered views, skip types not flagged in_everything
    if (!L.type && !typeCfg(e.type).in_everything) return false;
    const f = L.filters || {};
    if (f.language    && e.language    !== f.language)    return false;
    if (f.genre       && e.genre       !== f.genre)       return false;
    if (f.category    && e.category    !== f.category)    return false;
    if (f.subcategory && e.subCategory !== f.subcategory) return false;
    if (f.recommended && !isRec(e))                       return false;
    if (f.year        && e.year        !== String(f.year)) return false;
  }
  return true;
}

const emptyState = () => `<div class="empty-state"><div class="empty-state-icon">◌</div>Nothing here.<br>Try a different filter or search.</div>`;

function setViewMode(mode) {
  viewMode = mode;
  if (!isGalleryPage()) localStorage.setItem('viewMode', mode);
  updateFabState();
  show();
}

const isGalleryPage = () =>
  typeof window.__LISTING__ !== 'undefined' && window.__LISTING__.viewMode === 'gallery';

function rebuild() {
  filteredKeys = Object.keys(DATA).sort().reverse()
    .filter(k => (DATA[k] || []).some(e => entryMatches(e)));
  currentIdx = 0;
  if (isGalleryPage()) {
    buildGalleryFlow();
  } else {
    buildMobile();
    buildDesktop();
    updateLatest();
  }
  show();
}

function show() {
  const gFlow = document.getElementById('galleryFlow');
  if (gFlow) return; // gallery-flow pages manage their own visibility via CSS

  const lView = document.getElementById('lView');
  const mWrap = document.getElementById('mWrap');
  const dCols = document.getElementById('dCols');
  const desk  = window.innerWidth >= 640;
  if (viewMode === 'list') {
    mWrap.style.display = 'none'; dCols.style.display = 'none'; lView.style.display = 'block'; buildList();
  } else {
    lView.style.display = 'none';
    if (desk) { mWrap.style.display = 'none'; dCols.style.display = 'flex'; }
    else       { mWrap.style.display = 'block'; dCols.style.display = 'none'; applyOffset(false); }
  }
}

function updateLatest() {
  document.getElementById('latestChip').classList.toggle('visible', currentIdx > 0);
}

function goLatest() {
  currentIdx = 0;
  document.getElementById('mWrap').scrollTo({ left: 0, behavior: 'smooth' });
  document.getElementById('dCols').scrollLeft = 0;
  updateLatest();
}

const FLOPPY_LABEL_COLORS = ['#1c3461', '#6b1c24'];
function floppyLabelColor(title) {
  let h = 0;
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) >>> 0;
  return FLOPPY_LABEL_COLORS[h % FLOPPY_LABEL_COLORS.length];
}

function cardHTML(e, idx) {
  const uid  = e.uid;
  const si   = `style="--i:${idx || 0}"`;
  const cfg  = typeCfg(e.type);
  const tmpl = cfg.card_template || e.type;
  const recEl = isRec(e) ? `<span class="card-rec" data-tooltip="Recommended">✦</span>` : '';

  // ── book: reading ────────────────────────────────────────────
  if (tmpl === 'book') {
    const title = e.localTitle || e.title;
    const img   = e.image
      ? `<img class="card-cover-img" src="${e.image}" alt="${title}">`
      : `<div class="card-cover-blank"></div>`;
    const extBadge = e.link ? `<a class="card-ext" href="${withRef(e.link)}" target="_blank" rel="noopener" onclick="event.stopPropagation()" data-tooltip="Go to Link">${ICO.ext}</a>` : '';
    return `<div class="card" data-uid="${uid}" ${si} onclick="openSheet(this.dataset.uid)"><div class="card-cover">${img}<div class="card-spine"></div></div>${recEl}${extBadge}</div>`;
  }

  // ── browser: bookmarks ───────────────────────────────────────
  if (tmpl === 'browser') {
    const noteEl = e.summary ? `<div class="bm-note">${e.summary}</div>` : '';
    const dots   = `<div class="bm-dots"><span></span><span></span><span></span></div>`;
    return `<div class="card" data-uid="${uid}" ${si} onclick="openSheet(this.dataset.uid)"><div class="bm-card"><div class="bm-bar">${dots}<span class="bm-url">${e.domain || ''}</span><a class="bm-ext" href="${withRef(e.href)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${ICO.ext}</a></div><div class="bm-body"><div class="bm-title">${e.title}</div>${noteEl}</div></div></div>`;
  }

  // ── newsletter ───────────────────────────────────────────────
  if (tmpl === 'newsletter') {
    const rots = [-2.8, -2.0, -1.4, 1.2, 1.8, 2.6];
    const rh   = [...uid].reduce((a, c) => a + c.charCodeAt(0), 0);
    const rot  = rots[rh % rots.length];
    const img  = e.image ? `<img class="nl-card-img" src="${e.image}" alt="">` : `<div class="nl-card-blank"></div>`;
    return `<a class="card nl-card-wrap" href="${withRef(e.url)}" target="_blank" rel="noopener" style="--i:${idx||0};--rot:${rot}deg"><div class="nl-card">${img}</div><span class="nl-card-ext">${ICO.ext}</span></a>`;
  }

  // ── product: uses / projects / any gallery type ───────────────
  if (tmpl === 'product') {
    const src     = e.image || e.cover || '';
    const img     = src ? `<img class="gc-img" src="${src}" alt="${e.title}" loading="lazy">` : `<div class="gc-img-blank"></div>`;
    const rec     = isRec(e) ? `<span class="gc-rec">✦</span>` : '';
    const meta    = e.subCategory || e.year || '';
    const tagline = e.tagline ? `<span class="gc-tagline">${e.tagline}</span>` : '';
    const onClick = cfg.on_click || 'sheet';
    const extHref = e.href || e.url || '';
    let tag, attrs, extLink = '';
    if (onClick === 'external') {
      tag   = 'a';
      attrs = `href="${withRef(extHref)}" target="_blank" rel="noopener"`;
    } else if (onClick === 'page') {
      tag   = 'a';
      attrs = e.permalink
        ? `href="${e.permalink}"`
        : (extHref ? `href="${withRef(extHref)}" target="_blank" rel="noopener"` : '');
    } else {
      tag     = 'div';
      attrs   = `data-uid="${uid}" onclick="openSheet(this.dataset.uid)"`;
      extLink = extHref
        ? `<a class="gc-ext-link" href="${withRef(extHref)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${ICO.ext}</a>`
        : '';
    }
    const subcat = e.subCategory || e.category || e.genre || '';

    if (e.type === 'projects') {
      const lc   = floppyLabelColor(e.title);
      const desc = e.tagline ? `<span class="floppy-tagline">${e.tagline}</span>` : '';
      return `<${tag} class="floppy-card" data-type="projects" data-subcat="${subcat}" ${attrs} ${si}><div class="floppy"><div class="floppy-top"><div class="floppy-tab"></div><div class="floppy-shutter-zone"><div class="floppy-shutter"><div class="floppy-rw"></div></div></div><div class="floppy-tab"></div></div><div class="floppy-divider"></div><div class="floppy-label" style="--lc:${lc}"><div class="floppy-label-stripe"></div><div class="floppy-label-body"><div class="floppy-name">${e.title}</div>${desc}</div></div><div class="floppy-wp-l"></div><div class="floppy-wp-r"></div></div></${tag}>`;
    }

    return `<${tag} class="gc" data-type="${e.type}" data-subcat="${subcat}" ${attrs} ${si}>${extLink}<div class="gc-img-wrap">${img}</div><div class="gc-body"><div class="gc-title-row"><span class="gc-title">${e.title}</span>${rec}</div><span class="gc-meta">${meta}</span>${tagline}</div></${tag}>`;
  }

  // ── fallback ─────────────────────────────────────────────────
  return `<div class="card" data-uid="${uid}" ${si} onclick="openSheet(this.dataset.uid)"><div class="bm-card"><div class="bm-title">${e.title}</div></div></div>`;
}

function colContent(key) {
  return (DATA[key] || [])
    .filter(e => entryMatches(e))
    .sort((a, b) => a.day - b.day)
    .map((e, i) => { S[e.uid] = e; return cardHTML(e, i); })
    .join('');
}

function buildMobile() {
  const visible = filteredKeys.filter(k => colContent(k).length > 0);
  document.getElementById('mTrack').innerHTML = visible.length
    ? visible.map(k => `<div class="m-panel"><div class="month-label">${kFull(k)}</div>${colContent(k)}</div>`).join('')
    : `<div class="m-panel">${emptyState()}</div>`;
}

function goIdx(idx) {
  const panels = document.getElementById('mTrack').querySelectorAll('.m-panel');
  if (idx < 0 || idx >= panels.length) return;
  currentIdx = idx;
  panels[idx].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
  updateLatest();
}

function buildDesktop() {
  const visible = filteredKeys.filter(k => colContent(k).length > 0);
  document.getElementById('dCols').innerHTML = visible.length
    ? visible.map(k => `<div class="d-col"><div class="month-label">${kFull(k)}</div>${colContent(k)}</div>`).join('')
    : `<div class="d-col" style="width:100%;">${emptyState()}</div>`;
}

const LIST_TAG = {
  reading:    e => e.genre || '',
  bookmarks:  e => e.category || '',
  newsletter: () => 'Newsletter',
  uses:       e => e.subCategory || '',
  projects:   () => 'Project',
};

function listRowHTML(e, i) {
  S[e.uid] = e;
  const title   = e.localTitle || e.title || '';
  const tag     = (LIST_TAG[e.type] || (() => ''))(e);
  const rec     = isRec(e) ? ' ✦' : '';
  const tipImg  = e.image || e.cover || '';
  const wide    = ['projects', 'bookmarks', 'newsletter'].includes(e.type) ? 'wide' : e.type === 'uses' ? 'square' : '';
  const dataImg = tipImg ? `data-img="${tipImg}" data-wide="${wide}"` : '';
  const dataUid = `data-uid="${e.uid}"`;

  // Resolve href/external from on_click config
  const onClick = typeCfg(e.type).on_click || 'sheet';
  let href = null, external = false;
  if (onClick === 'external') {
    href = withRef(e.href || e.url || '');
    external = true;
  } else if (onClick === 'page') {
    href = e.permalink || (e.href ? withRef(e.href) : null);
    external = !e.permalink && !!e.href;
  }
  // sheet: href stays null — show ext icon if entry has an outbound href (e.g. bookmarks)
  const ext  = (external || !!e.href) ? `<span class="l-ext">${ICO.ext}</span>` : '';
  const body = `<div class="l-title">${title}${rec}${ext}</div><div class="l-tag">${tag}</div>`;

  if (href) {
    const attrs = external ? `href="${href}" target="_blank" rel="noopener"` : `href="${href}"`;
    return `<a class="l-row" data-type="${e.type}" ${dataUid} ${dataImg} ${attrs} style="--i:${i}">${body}</a>`;
  }
  return `<div class="l-row" data-type="${e.type}" ${dataUid} ${dataImg} style="--i:${i}" onclick="openSheet(this.dataset.uid)">${body}</div>`;
}

function buildList() {
  const lView = document.getElementById('lView');
  const groupBy = (typeof window.__LISTING__ !== 'undefined' && window.__LISTING__.groupBy) || 'month';
  const allEntries = filteredKeys.flatMap(k =>
    (DATA[k] || []).filter(e => entryMatches(e)).sort((a, b) => a.day - b.day)
  );
  if (!allEntries.length) { lView.innerHTML = emptyState(); return; }

  if (groupBy === 'none') {
    lView.innerHTML = allEntries.map((e, i) => listRowHTML(e, i)).join('');
    return;
  }

  // Default: group by month
  lView.innerHTML = filteredKeys.map(k => {
    const entries = (DATA[k] || []).filter(e => entryMatches(e)).sort((a, b) => a.day - b.day);
    if (!entries.length) return '';
    return `<div><div class="l-month-label">${kFull(k)}</div>${entries.map((e, i) => listRowHTML(e, i)).join('')}</div>`;
  }).join('');
}

function isPanel(e) {
  return typeCfg(e.type).on_click === 'page';
}

// JS-based gallery subtype filter (used when URL-based nav would 404)
function fabGalleryFilter(category, el) {
  if (typeof window.__LISTING__ === 'undefined') return;
  if (!window.__LISTING__.filters) window.__LISTING__.filters = {};
  const isActive = window.__LISTING__.filters.category === category;
  window.__LISTING__.filters.category = isActive ? '' : category;
  document.querySelectorAll('#phSubtypesWrap .ph-pill').forEach(p => p.classList.remove('active'));
  if (!isActive) el.classList.add('active');
  rebuild();
}

function openEntryByUid(uid) {
  const e = S[uid];
  if (!e) return;
  if (e.type === 'notes' || isPanel(e)) openPanel(uid); else openSheet(uid);
}

function buildGalleryFlow() {
  const flow = document.getElementById('galleryFlow');
  if (!flow) return;
  // Preserve the static info cell rendered by Hugo
  const infoCell = flow.querySelector('.gc-info-cell');
  // Flatten + sort newest first
  const all = [];
  filteredKeys.forEach(k => {
    const [y, m] = k.split('-');
    (DATA[k] || []).filter(e => entryMatches(e)).forEach(e => {
      S[e.uid] = e;
      all.push({ e, ts: new Date(+y, +m - 1, e.day || 1).getTime() });
    });
  });
  all.sort((a, b) => b.ts - a.ts);
  const cards = all.length ? all.map(({ e }, i) => cardHTML(e, i)).join('') : emptyState();
  flow.innerHTML = (infoCell ? infoCell.outerHTML : '') + cards;
}

document.addEventListener('DOMContentLoaded', () => {
  if (typeof DATA === 'undefined') return;
  Object.values(DATA).forEach(entries => entries.forEach(e => { S[e.uid] = e; }));
  if (!isGalleryPage()) {
    const saved = localStorage.getItem('viewMode');
    if (saved) viewMode = saved;
  }
  rebuild();

  if (typeof window.__OPEN_UID__ !== 'undefined') {
    openSheet(window.__OPEN_UID__);
  }

  window.addEventListener('popstate', () => {
    if (document.getElementById('sidePanel')?.classList.contains('open')) {
      closePanel(true); return;
    }
    if (document.getElementById('sheetOverlay')?.classList.contains('open')) {
      closeSheet(true); return;
    }
    rebuild();
  });

  // Global cursor-following tooltip for list view
  const lTip = document.createElement('div');
  lTip.id = 'lTip';
  lTip.innerHTML = '<div class="l-tip-img"></div>';
  document.body.appendChild(lTip);

  const lView = document.getElementById('lView');
  let _tipSrc = '';

  lView.addEventListener('mousemove', ev => {
    const row = ev.target.closest('.l-row');
    if (!row || !row.dataset.img) { lTip.classList.remove('show'); return; }

    // Update image only when row changes
    if (row.dataset.img !== _tipSrc) {
      _tipSrc = row.dataset.img;
      const imgDiv = lTip.querySelector('.l-tip-img');
      imgDiv.className = 'l-tip-img' + (row.dataset.wide === 'wide' ? ' wide' : row.dataset.wide === 'square' ? ' square' : '');
      imgDiv.innerHTML = `<img src="${_tipSrc}" alt="">`;
    }

    // Position: right of cursor, flip left near edge
    const W = 150, pad = 20;
    let x = ev.clientX + pad;
    let y = ev.clientY - 60;
    if (x + W > window.innerWidth - 12) x = ev.clientX - W - pad;
    y = Math.max(8, Math.min(y, window.innerHeight - 220));
    lTip.style.left = x + 'px';
    lTip.style.top  = y + 'px';
    lTip.classList.add('show');
  });

  lView.addEventListener('mouseleave', () => {
    lTip.classList.remove('show');
    _tipSrc = '';
  });

  // Disable card clicks during horizontal scroll, track current panel
  let _hScrollTimer;
  const mWrap  = document.getElementById('mWrap');
  const mTrack = document.getElementById('mTrack');
  mWrap.addEventListener('scroll', () => {
    mTrack.classList.add('is-scrolling');
    clearTimeout(_hScrollTimer);
    _hScrollTimer = setTimeout(() => mTrack.classList.remove('is-scrolling'), 300);
    const panelW = mWrap.querySelector('.m-panel')?.offsetWidth || mWrap.offsetWidth;
    currentIdx = Math.round(mWrap.scrollLeft / panelW);
    updateLatest();
  }, { passive: true });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeSheet(); closePanel(); }
  });

  window.addEventListener('resize', () => {
    if (viewMode === 'card') show();
  });
});
