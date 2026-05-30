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

function projIcon(title) {
  let s = 0;
  for (let i = 0; i < title.length; i++) s = (s * 31 + title.charCodeAt(i)) >>> 0;
  const w = '1';
  const icons = [
    // 0: Two overlapping squares → octagram
    `<rect x="8" y="8" width="24" height="24" fill="none" stroke="currentColor" stroke-width="${w}"/>
     <rect x="8" y="8" width="24" height="24" fill="none" stroke="currentColor" stroke-width="${w}" transform="rotate(45 20 20)"/>
     <circle cx="20" cy="20" r="3.5" fill="none" stroke="currentColor" stroke-width="${w}"/>`,
    // 1: Flower of Life — 7 circles
    `<circle cx="20" cy="20" r="7" fill="none" stroke="currentColor" stroke-width="${w}"/>
     <circle cx="20" cy="13" r="7" fill="none" stroke="currentColor" stroke-width="${w}"/>
     <circle cx="26.06" cy="16.5" r="7" fill="none" stroke="currentColor" stroke-width="${w}"/>
     <circle cx="26.06" cy="23.5" r="7" fill="none" stroke="currentColor" stroke-width="${w}"/>
     <circle cx="20" cy="27" r="7" fill="none" stroke="currentColor" stroke-width="${w}"/>
     <circle cx="13.94" cy="23.5" r="7" fill="none" stroke="currentColor" stroke-width="${w}"/>
     <circle cx="13.94" cy="16.5" r="7" fill="none" stroke="currentColor" stroke-width="${w}"/>`,
    // 2: Star of David (two triangles)
    `<polygon points="20,5 32.1,27 7.9,27" fill="none" stroke="currentColor" stroke-width="${w}"/>
     <polygon points="20,35 32.1,13 7.9,13" fill="none" stroke="currentColor" stroke-width="${w}"/>
     <circle cx="20" cy="20" r="3" fill="none" stroke="currentColor" stroke-width="${w}"/>`,
    // 3: Four rotated squares + centre dot
    `<rect x="9" y="9" width="22" height="22" fill="none" stroke="currentColor" stroke-width="${w}" transform="rotate(0 20 20)"/>
     <rect x="9" y="9" width="22" height="22" fill="none" stroke="currentColor" stroke-width="${w}" transform="rotate(22.5 20 20)"/>
     <rect x="9" y="9" width="22" height="22" fill="none" stroke="currentColor" stroke-width="${w}" transform="rotate(45 20 20)"/>
     <circle cx="20" cy="20" r="3" fill="currentColor"/>`,
    // 4: Three interlocking circles (Borromean)
    `<circle cx="20" cy="13" r="9" fill="none" stroke="currentColor" stroke-width="${w}"/>
     <circle cx="13" cy="25" r="9" fill="none" stroke="currentColor" stroke-width="${w}"/>
     <circle cx="27" cy="25" r="9" fill="none" stroke="currentColor" stroke-width="${w}"/>`,
    // 5: Art Deco sunburst
    `<line x1="20" y1="33" x2="5"  y2="8"  stroke="currentColor" stroke-width="${w}"/>
     <line x1="20" y1="33" x2="11" y2="6"  stroke="currentColor" stroke-width="${w}"/>
     <line x1="20" y1="33" x2="15" y2="5"  stroke="currentColor" stroke-width="${w}"/>
     <line x1="20" y1="33" x2="20" y2="5"  stroke="currentColor" stroke-width="${w}"/>
     <line x1="20" y1="33" x2="25" y2="5"  stroke="currentColor" stroke-width="${w}"/>
     <line x1="20" y1="33" x2="29" y2="6"  stroke="currentColor" stroke-width="${w}"/>
     <line x1="20" y1="33" x2="35" y2="8"  stroke="currentColor" stroke-width="${w}"/>
     <path d="M5 8 A17 17 0 0 1 35 8" fill="none" stroke="currentColor" stroke-width="${w}"/>`,
    // 6: 8-point compass star
    `<path d="M20 4 L22.5 17.5 L36 20 L22.5 22.5 L20 36 L17.5 22.5 L4 20 L17.5 17.5 Z" fill="none" stroke="currentColor" stroke-width="${w}"/>
     <polygon points="20,11 26,20 20,29 14,20" fill="none" stroke="currentColor" stroke-width="${w}"/>
     <circle cx="20" cy="20" r="2.5" fill="currentColor"/>`,
    // 7: Three rotated pentagons
    `<polygon points="20,6 29.5,13 26,24.5 14,24.5 10.5,13" fill="none" stroke="currentColor" stroke-width="${w}"/>
     <polygon points="20,6 29.5,13 26,24.5 14,24.5 10.5,13" fill="none" stroke="currentColor" stroke-width="${w}" transform="rotate(36 20 20)"/>
     <polygon points="20,6 29.5,13 26,24.5 14,24.5 10.5,13" fill="none" stroke="currentColor" stroke-width="${w}" transform="rotate(72 20 20)"/>`,
    // 8: Nested concentric rotated squares
    `<rect x="5"  y="5"  width="30" height="30" fill="none" stroke="currentColor" stroke-width="${w}"/>
     <rect x="9"  y="9"  width="22" height="22" fill="none" stroke="currentColor" stroke-width="${w}" transform="rotate(22.5 20 20)"/>
     <rect x="13" y="13" width="14" height="14" fill="none" stroke="currentColor" stroke-width="${w}"/>
     <rect x="17" y="17" width="6"  height="6"  fill="none" stroke="currentColor" stroke-width="${w}" transform="rotate(22.5 20 20)"/>`,
    // 9: Islamic 12-point — three overlapping squares
    `<rect x="9" y="9" width="22" height="22" fill="none" stroke="currentColor" stroke-width="${w}" transform="rotate(0 20 20)"/>
     <rect x="9" y="9" width="22" height="22" fill="none" stroke="currentColor" stroke-width="${w}" transform="rotate(30 20 20)"/>
     <rect x="9" y="9" width="22" height="22" fill="none" stroke="currentColor" stroke-width="${w}" transform="rotate(60 20 20)"/>
     <circle cx="20" cy="20" r="3.5" fill="none" stroke="currentColor" stroke-width="${w}"/>`,
  ];
  return `<svg class="gc-proj-icon" viewBox="0 0 40 40" fill="currentColor" xmlns="http://www.w3.org/2000/svg">${icons[s % icons.length]}</svg>`;
}

function cardHTML(e, idx) {
  const uid  = e.uid;
  const si   = `style="--i:${idx || 0}"`;
  const cfg  = typeCfg(e.type);
  const tmpl = cfg.card_template || e.type;
  const recEl = isRec(e) ? `<span class="card-rec">✦</span>` : '';

  // ── book: reading ────────────────────────────────────────────
  if (tmpl === 'book') {
    const title = e.localTitle || e.title;
    const img   = e.image
      ? `<img class="card-cover-img" src="${e.image}" alt="${title}">`
      : `<div class="card-cover-blank"></div>`;
    return `<div class="card" data-uid="${uid}" ${si} onclick="openSheet(this.dataset.uid)"><div class="card-cover">${img}<div class="card-spine"></div></div><div class="card-below"><span class="card-title">${title}</span>${recEl}</div></div>`;
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
      const icon = e.icon
        ? `<img class="gc-proj-icon" src="${e.icon}" alt="" loading="lazy">`
        : projIcon(e.title);
      const desc = e.tagline ? `<p class="gc-proj-desc">${e.tagline}</p>` : '';
      const typeLabel = 'Project';
      return `<${tag} class="gc gc-proj" data-type="projects" data-subcat="${subcat}" ${attrs} ${si}><span class="gc-proj-type">${typeLabel}</span><div class="gc-proj-icon-wrap">${icon}</div><div class="gc-proj-body"><span class="gc-proj-title">${e.title}</span>${desc}</div></${tag}>`;
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
  if (isPanel(e)) openPanel(uid); else openSheet(uid);
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
