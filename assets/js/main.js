// DATA and PAGE_CONTENT are injected by Hugo via listing templates

const S = {};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const kFull  = k => { const [y,m] = k.split('-'); return `${MONTHS[+m-1].slice(0,3)} '${y.slice(2)}`; };

let viewMode = 'card';
let filteredKeys = [];

const isRec    = e => e.recommended;
const typeCfg  = type => (typeof TYPES_CFG !== 'undefined' ? TYPES_CFG : []).find(t => t.id === type) || {};

const _urlQ = new URLSearchParams(location.search).get('q') || '';

function injectQBackBtn() {
  if (!_urlQ) return;
  const btn = document.createElement('a');
  btn.className = 'q-back-btn';
  btn.href = location.pathname;
  const section = location.pathname.replace(/\//g, '') || 'everything';
  btn.innerHTML = `← Back to ${section.charAt(0).toUpperCase() + section.slice(1)}`;
  document.body.appendChild(btn);
}
injectQBackBtn();

function entryMatches(e) {
  if (typeof window.__LISTING__ !== 'undefined') {
    const L = window.__LISTING__;
    if (L.type && e.type !== L.type) return false;
    if (!L.type && !typeCfg(e.type).in_everything) return false;
    const f = L.filters || {};
    if (f.language    && e.language    !== f.language)    return false;
    if (f.genre       && e.genre       !== f.genre)       return false;
    if (f.category    && e.category    !== f.category)    return false;
    if (f.subcategory && e.subCategory !== f.subcategory) return false;
    if (f.recommended && !isRec(e))                       return false;
    if (f.year        && e.year        !== String(f.year)) return false;
  }
  if (_urlQ) {
    const q = _urlQ.toLowerCase();
    if (q === 'recommended') {
      if (!isRec(e)) return false;
    } else {
      const hay = [e.title, e.localTitle, e.author, e.language, e.genre, e.subCategory, e.domain]
        .filter(Boolean).join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
  }
  return true;
}

const emptyState = () => `<div class="empty-state"><div class="empty-state-icon">◌</div>Nothing here.<br>Try a different filter or search.</div>`;

function setViewMode(mode) {
  viewMode = mode;
  localStorage.setItem('viewMode', mode);
  updateFabState();
  // Show bio-hide toggle only in list view
  const bioToggle = document.getElementById('bioToggleBtn');
  if (bioToggle) bioToggle.style.display = mode === 'list' ? 'inline-flex' : 'none';
  show();
}

function toggleBio() {
  const layout = document.getElementById('homeLayout');
  if (!layout) return;
  layout.classList.toggle('bio-hidden');
  const btn = document.getElementById('bioToggleBtn');
  if (btn) btn.textContent = layout.classList.contains('bio-hidden') ? 'Show bio' : 'Hide bio';
}

function rebuild() {
  filteredKeys = Object.keys(DATA).sort().reverse()
    .filter(k => (DATA[k] || []).some(e => entryMatches(e)));
  buildCardView();
  show();
}

function show() {
  const cv    = document.getElementById('cardView');
  const lView = document.getElementById('lView');
  if (!cv || !lView) return;
  const isHome = cv.classList.contains('cv-home');
  const track  = document.getElementById('cvTrack');
  if (viewMode === 'list') {
    if (isHome) {
      // Keep bio/controls/nav visible — only hide the scrollable track
      if (track) track.style.display = 'none';
    } else {
      cv.style.display = 'none';
    }
    lView.style.display = 'block';
    buildList();
  } else {
    if (isHome) {
      if (track) track.style.display = '';
    } else {
      cv.style.display = '';
    }
    lView.style.display = 'none';
  }
}

function updateLatest() {
  const cv   = document.getElementById('cardView');
  const chip = document.getElementById('latestChip');
  if (chip && cv) chip.classList.toggle('visible', cv.scrollLeft > 80);
}

function goLatest() {
  const cv = document.getElementById('cardView');
  if (cv) cv.scrollTo({ left: 0, behavior: 'smooth' });
}

// Persist card scroll position across page navigations (projects)
const _scrollKey = 'cv-scroll:' + location.pathname;
document.addEventListener('DOMContentLoaded', () => {
  const cv = document.getElementById('cardView');
  if (!cv) return;
  const saved = sessionStorage.getItem(_scrollKey);
  if (saved) { cv.scrollLeft = parseInt(saved, 10); sessionStorage.removeItem(_scrollKey); }
  cv.addEventListener('click', e => {
    const card = e.target.closest('[data-type="projects"]');
    if (card) sessionStorage.setItem(_scrollKey, cv.scrollLeft);
  }, true);
});

const FLOPPY_LABEL_COLORS = ['#1c3461', '#6b1c24', '#1a4a2e', '#4a2a0a', '#2a1a4a', '#0a3a4a'];
function floppyLabelColor(title) {
  let h = 0;
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) >>> 0;
  return FLOPPY_LABEL_COLORS[h % FLOPPY_LABEL_COLORS.length];
}

// Project-specific hand-drawn marks
function floppySticker() {
  return '';
}

function cardHTML(e, idx) {
  const uid  = e.uid;
  const si   = `style="--i:${idx || 0}"`;
  const cfg  = typeCfg(e.type);
  const tmpl = cfg.card_template || e.type;
  const recEl = isRec(e) ? `<svg class="card-rec" viewBox="0 0 12 28" xmlns="http://www.w3.org/2000/svg" aria-label="Recommended"><path d="M0 0h12v28l-6-6-6 6z" fill="#A67C00"/></svg><span class="card-rec-label">Recommended</span>` : '';

  // ── book ─────────────────────────────────────────────
  if (tmpl === 'book') {
    const title = e.localTitle || e.title;
    const img   = e.image
      ? `<img class="card-cover-img" src="${e.image}" alt="${title}">`
      : `<div class="card-cover-blank"></div>`;
    const extBadge = e.link ? `<a class="card-ext" href="${withRef(e.link)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${ICO.ext}</a>` : '';
    // Both recEl and extBadge inside card-cover so they tilt with the 3D hover
    return `<div class="card" data-uid="${uid}" data-type="${e.type}" ${si} onclick="openSheet(this.dataset.uid)"><div class="card-cover">${img}<div class="card-spine"></div>${recEl}${extBadge}</div></div>`;
  }

  // ── browser ───────────────────────────────────────────
  if (tmpl === 'browser') {
    const noteEl = e.summary ? `<div class="bm-note">${e.summary}</div>` : '';
    const dots   = `<div class="bm-dots"><span></span><span></span><span></span></div>`;
    return `<div class="card" data-uid="${uid}" data-type="${e.type}" ${si} onclick="openSheet(this.dataset.uid)"><div class="bm-card"><div class="bm-bar">${dots}<span class="bm-url">${e.domain || ''}</span><a class="bm-ext" href="${withRef(e.href)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${ICO.ext}</a></div><div class="bm-body"><div class="bm-title">${e.title}</div>${noteEl}</div></div></div>`;
  }

  // ── newsletter ────────────────────────────────────────
  if (tmpl === 'newsletter') {
    const rots = [-2.8, -2.0, -1.4, 1.2, 1.8, 2.6];
    const rh   = [...uid].reduce((a, c) => a + c.charCodeAt(0), 0);
    const rot  = rots[rh % rots.length];
    const img  = e.image ? `<img class="nl-card-img" src="${e.image}" alt="">` : `<div class="nl-card-blank"></div>`;
    return `<a class="card nl-card-wrap" href="${withRef(e.url)}" target="_blank" rel="noopener" style="--i:${idx||0};--rot:${rot}deg"><div class="nl-card">${img}</div><span class="nl-card-ext">${ICO.ext}</span></a>`;
  }

  // ── product (uses, projects, any gallery type) ────────
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
      tag   = 'div';
      attrs = `data-uid="${uid}" onclick="openEntryByUid('${uid}')"`;
    } else {
      tag     = 'div';
      attrs   = `data-uid="${uid}" onclick="openSheet(this.dataset.uid)"`;
      extLink = extHref
        ? `<a class="gc-ext-link" href="${withRef(extHref)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${ICO.ext}</a>`
        : '';
    }
    const subcat = e.subCategory || e.category || e.genre || '';

    if (e.type === 'uses') {
      const src = e.image || '';
      const img = src ? `<img class="gc-img" src="${src}" alt="${e.title}" loading="lazy">` : `<div class="gc-img-blank"></div>`;
      return `<div class="gc gc--uses" data-type="uses" data-uid="${uid}" ${si} onclick="openSheet(this.dataset.uid)"><div class="gc-img-wrap">${img}</div><div class="gc-uses-label">${e.title}</div></div>`;
    }

    if (e.type === 'projects') {
      const lc      = floppyLabelColor(e.title);
      const desc    = e.tagline ? `<span class="floppy-tagline">${e.tagline}</span>` : '';
      const sticker = floppySticker(e);
      return `<${tag} class="floppy-card" data-type="projects" data-subcat="${subcat}" ${attrs} ${si}><div class="floppy"><div class="floppy-top"><div class="floppy-tab"></div><div class="floppy-shutter-zone"><div class="floppy-shutter"><div class="floppy-rw"></div></div></div><div class="floppy-tab"></div></div><div class="floppy-divider"></div><div class="floppy-label" style="--lc:${lc}"><div class="floppy-label-stripe"></div><div class="floppy-label-body">${sticker}<div class="floppy-name">${e.title}</div>${desc}</div></div><div class="floppy-wp-l"></div><div class="floppy-wp-r"></div></div></${tag}>`;
    }

    return `<${tag} class="gc" data-type="${e.type}" data-subcat="${subcat}" ${attrs} ${si}>${extLink}<div class="gc-img-wrap">${img}</div><div class="gc-body"><div class="gc-title-row"><span class="gc-title">${e.title}</span>${rec}</div><span class="gc-meta">${meta}</span>${tagline}</div></${tag}>`;
  }

  // ── fallback ──────────────────────────────────────────
  return `<div class="card" data-uid="${uid}" data-type="${e.type}" ${si} onclick="openSheet(this.dataset.uid)"><div class="bm-card"><div class="bm-title">${e.title}</div></div></div>`;
}

// ── Card view (horizontal month groups) ──────────────────

function activeGroupBy() {
  // Derive grouping from TYPES_CFG based on the active filter type.
  // Mixed / everything view defaults to month.
  const types = filteredKeys.flatMap(k => DATA[k] || []).map(e => e.type);
  const unique = [...new Set(types)];
  if (unique.length === 1) {
    const cfg = typeCfg(unique[0]);
    return cfg.group_by || 'month';
  }
  return 'month';
}

function buildCardView() {
  const track = document.getElementById('cvTrack');
  if (!track) return;

  const groupBy = activeGroupBy();

  if (groupBy === 'year') {
    const entries = filteredKeys.flatMap(k =>
      (DATA[k] || []).filter(e => entryMatches(e)).sort((a, b) => b.day - a.day)
    );
    if (!entries.length) { track.innerHTML = `<div class="cv-month">${emptyState()}</div>`; return; }
    entries.forEach(e => { S[e.uid] = e; });
    const cutoff = new Date().getFullYear() - 4;
    const byYear = {};
    entries.forEach(e => {
      const y = parseInt(((e.date || '').match(/\d{4}/) || ['0'])[0], 10);
      const key = y <= cutoff ? `${cutoff} & Earlier` : String(y);
      if (!byYear[key]) byYear[key] = [];
      byYear[key].push(e);
    });
    const sortKey = k => k.match(/^\d{4}$/) ? parseInt(k, 10) : 0;
    track.innerHTML = Object.keys(byYear).sort((a, b) => sortKey(b) - sortKey(a)).map(y => {
      const cards = byYear[y].map((e, i) => cardHTML(e, i)).join('');
      return `<div class="cv-month"><div class="cv-label">${y}</div><div class="cv-items">${cards}</div></div>`;
    }).join('');
    return;
  }

  const CUTOFF = 2022;
  const homeLimit = (typeof window.__LISTING__ !== 'undefined' && window.__LISTING__.homeLimit) || 0;
  const isHome = !!document.getElementById('cardView')?.classList.contains('cv-home');

  const recentKeys = filteredKeys.filter(k => parseInt(k.split('-')[0], 10) > CUTOFF);
  const oldKeys    = filteredKeys.filter(k => parseInt(k.split('-')[0], 10) <= CUTOFF);

  let itemCount = 0;
  const months = recentKeys.map(key => {
    if (homeLimit && isHome && itemCount >= homeLimit) return '';
    let entries = (DATA[key] || [])
      .filter(e => entryMatches(e))
      .sort((a, b) => b.day - a.day);
    if (!entries.length) return '';
    if (homeLimit && isHome) {
      entries = entries.slice(0, homeLimit - itemCount);
    }
    itemCount += entries.length;
    entries.forEach(e => { S[e.uid] = e; });
    const cards = entries.map((e, i) => cardHTML(e, i)).join('');
    return `<div class="cv-month"><div class="cv-label">${kFull(key)}</div><div class="cv-items">${cards}</div></div>`;
  }).filter(Boolean);

  if (!isHome || !homeLimit) {
    const oldEntries = oldKeys.flatMap(k =>
      (DATA[k] || []).filter(e => entryMatches(e)).sort((a, b) => b.day - a.day)
    );
    if (oldEntries.length) {
      oldEntries.forEach(e => { S[e.uid] = e; });
      const cards = oldEntries.map((e, i) => cardHTML(e, i)).join('');
      months.push(`<div class="cv-month"><div class="cv-label">2022 & Earlier</div><div class="cv-items">${cards}</div></div>`);
    }
  }

  track.innerHTML = months.length
    ? months.join('')
    : `<div class="cv-month">${emptyState()}</div>`;
}

// ── List view ─────────────────────────────────────────────

const LIST_TAG = {
  reading:    e => e.genre || '',
  bookmarks:  e => e.category || '',
  newsletter: () => 'Newsletter',
  uses:       e => e.subCategory || '',
  projects:   () => '',
};

function listRowHTML(e, i) {
  S[e.uid] = e;
  const title   = e.localTitle || e.title || '';
  const tag     = (LIST_TAG[e.type] || (() => ''))(e);
  const rec     = isRec(e) ? '<span class="l-rec">✦</span>' : '';
  const tipImg  = (e.type === 'reading') ? (e.image || e.cover || '') : '';
  const wide    = ['projects', 'bookmarks', 'newsletter'].includes(e.type) ? 'wide' : e.type === 'uses' ? 'square' : '';
  const dataImg = tipImg ? `data-img="${tipImg}" data-wide="${wide}"` : '';
  const dataUid = `data-uid="${e.uid}"`;

  const onClick = typeCfg(e.type).on_click || 'sheet';
  let href = null, external = false;
  if (onClick === 'external') {
    href = withRef(e.href || e.url || '');
    external = true;
  } else if (onClick === 'page') {
    href = e.permalink || (e.href ? withRef(e.href) : null);
    external = !e.permalink && !!e.href;
  }
  const ext = external ? `<span class="l-ext">${ICO.ext}</span>` : '';
  const tagline  = e.type === 'projects' && e.tagline ? `<div class="l-note">${e.tagline}</div>` : '';
  const body   = `<div class="l-title">${title}${rec}${ext}</div>${tagline}<div class="l-tag">${tag}</div>`;

  if (href) {
    const attrs = external ? `href="${href}" target="_blank" rel="noopener"` : `href="${href}"`;
    return `<a class="l-row" data-type="${e.type}" ${dataUid} ${dataImg} ${attrs} style="--i:${i}">${body}</a>`;
  }
  return `<div class="l-row" data-type="${e.type}" ${dataUid} ${dataImg} style="--i:${i}" onclick="openSheet(this.dataset.uid)">${body}</div>`;
}

function buildList() {
  const lView = document.getElementById('lView');
  if (!lView) return;
  const groupBy = activeGroupBy();
  const sorted = k => (DATA[k] || []).filter(e => entryMatches(e)).sort((a, b) => b.day - a.day);

  const allEntries = filteredKeys.flatMap(k => sorted(k));
  if (!allEntries.length) { lView.innerHTML = emptyState(); return; }

  if (groupBy === 'year') {
    const byYear = {};
    allEntries.forEach(e => {
      const y = ((e.date || '').match(/\d{4}/) || ['—'])[0];
      if (!byYear[y]) byYear[y] = [];
      byYear[y].push(e);
    });
    lView.innerHTML = Object.keys(byYear).sort((a, b) => b.localeCompare(a)).map(y => {
      return `<div><div class="l-month-label">${y}</div>${byYear[y].map((e, i) => listRowHTML(e, i)).join('')}</div>`;
    }).join('');
    return;
  }

  const CUTOFF = 2022;
  const recentKeys = filteredKeys.filter(k => parseInt(k.split('-')[0], 10) > CUTOFF);
  const oldKeys    = filteredKeys.filter(k => parseInt(k.split('-')[0], 10) <= CUTOFF);

  let html = recentKeys.map(k => {
    const entries = sorted(k);
    if (!entries.length) return '';
    return `<div><div class="l-month-label">${kFull(k)}</div>${entries.map((e, i) => listRowHTML(e, i)).join('')}</div>`;
  }).join('');

  if (oldKeys.length) {
    const oldEntries = oldKeys.flatMap(k => sorted(k));
    if (oldEntries.length) {
      html += `<div><div class="l-month-label">2022 & Earlier</div>${oldEntries.map((e, i) => listRowHTML(e, i)).join('')}</div>`;
    }
  }
  lView.innerHTML = html;
}

function isPanel(e) {
  return typeCfg(e.type).on_click === 'page';
}

function openEntryByUid(uid) {
  const e = S[uid];
  if (!e) return;
  if (e.type === 'notes' || isPanel(e)) openPanel(uid); else openSheet(uid);
}

document.addEventListener('DOMContentLoaded', () => {
  if (typeof DATA === 'undefined') return;
  Object.values(DATA).forEach(entries => entries.forEach(e => { S[e.uid] = e; }));

  const listOnly = typeof window.__LISTING__ !== 'undefined' && window.__LISTING__.listOnly;
  if (listOnly) {
    viewMode = 'list';
    document.getElementById('phViewBtn')?.style.setProperty('display', 'none');
    document.getElementById('cardView')?.style.setProperty('display', 'none');
  } else {
    const isHome = !!document.getElementById('cardView')?.classList.contains('cv-home');
    const saved = localStorage.getItem('viewMode');
    if (saved && !isHome) viewMode = saved;
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

  // Latest chip visibility on card view scroll
  const cv = document.getElementById('cardView');
  if (cv) cv.addEventListener('scroll', updateLatest, { passive: true });

  // Cursor-following image tooltip for list view
  const lTip = document.createElement('div');
  lTip.id = 'lTip';
  lTip.innerHTML = '<div class="l-tip-img"></div>';
  document.body.appendChild(lTip);

  const lView = document.getElementById('lView');
  let _tipSrc = '';

  if (!lView) return;

  lView.addEventListener('mousemove', ev => {
    const row = ev.target.closest('.l-row');
    if (!row || !row.dataset.img) { lTip.classList.remove('show'); return; }
    if (row.dataset.img !== _tipSrc) {
      _tipSrc = row.dataset.img;
      const imgDiv = lTip.querySelector('.l-tip-img');
      imgDiv.className = 'l-tip-img' + (row.dataset.wide === 'wide' ? ' wide' : row.dataset.wide === 'square' ? ' square' : '');
      imgDiv.innerHTML = `<img src="${_tipSrc}" alt="">`;
    }
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

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeSheet(); closePanel();
      const wrap = document.getElementById('shFilter');
      if (wrap) wrap.dataset.open = 'false';
    }
  });

  window.addEventListener('resize', () => {
    if (viewMode === 'card') show();
  });
});

function toggleHomeFilter(e) {
  e && e.stopPropagation();
  const wrap = document.getElementById('shFilter');
  if (!wrap) return;
  const opening = wrap.dataset.open !== 'true';
  wrap.dataset.open = opening ? 'true' : 'false';
  document.getElementById('shFilterBtn')?.setAttribute('aria-expanded', String(opening));
  if (opening) {
    requestAnimationFrame(() => {
      document.addEventListener('click', _shFilterOutside, { once: true });
    });
  }
}

function _shFilterOutside(e) {
  const wrap = document.getElementById('shFilter');
  if (!wrap?.contains(e.target)) {
    wrap && (wrap.dataset.open = 'false');
    document.getElementById('shFilterBtn')?.setAttribute('aria-expanded', 'false');
  }
}

function setFilter(type, label) {
  if (typeof window.__LISTING__ === 'undefined') return;
  window.__LISTING__.type = type || null;
  rebuild();
  document.querySelectorAll('.sh-dp-item').forEach(p => {
    p.classList.toggle('active', (p.dataset.type || '') === (type || ''));
  });
  const lbl = document.getElementById('shFilterLabel');
  if (lbl) lbl.textContent = label || 'Everything';
  const wrap = document.getElementById('shFilter');
  if (wrap) wrap.dataset.open = 'false';
  document.getElementById('shFilterBtn')?.setAttribute('aria-expanded', 'false');
}

