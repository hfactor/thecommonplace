// DATA is injected by Hugo via listing templates

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
  updateFabState();
  show();
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
      tag   = 'a';
      attrs = `href="${e.permalink || extHref}"`;
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

  if (groupBy === 'none') {
    const entries = filteredKeys.flatMap(k =>
      (DATA[k] || []).filter(e => entryMatches(e)).sort((a, b) => b.day - a.day)
    );
    if (!entries.length) { track.innerHTML = `<div class="cv-month">${emptyState()}</div>`; return; }
    entries.forEach(e => { S[e.uid] = e; });
    track.innerHTML = `<div class="cv-month"><div class="cv-items">${entries.map((e, i) => cardHTML(e, i)).join('')}</div></div>`;
    return;
  }

  if (groupBy === 'category') {
    const entries = filteredKeys.flatMap(k =>
      (DATA[k] || []).filter(e => entryMatches(e)).sort((a, b) => (a.title || '').localeCompare(b.title || ''))
    );
    if (!entries.length) { track.innerHTML = `<div class="cv-month">${emptyState()}</div>`; return; }
    entries.forEach(e => { S[e.uid] = e; });
    const byCat = {};
    entries.forEach(e => {
      const cat = e.subCategory || e.category || 'Other';
      if (!byCat[cat]) byCat[cat] = [];
      byCat[cat].push(e);
    });
    track.innerHTML = Object.keys(byCat).sort().map(cat => {
      const cards = byCat[cat].map((e, i) => cardHTML(e, i)).join('');
      return `<div class="cv-month"><div class="cv-label">${cat}</div><div class="cv-items">${cards}</div></div>`;
    }).join('');
    return;
  }

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
  bookmarks:  e => e.domain || '',
  newsletter: () => 'Newsletter',
  uses:       e => e.subCategory || '',
  projects:   e => e.tagline || '',
};

function listRowHTML(e) {
  S[e.uid] = e;
  const title  = e.localTitle || e.title || '';
  const tag    = (LIST_TAG[e.type] || (() => ''))(e);
  const rec    = isRec(e) ? '<span class="l-rec">✦</span>' : '';
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
  const ext     = external ? `<span class="l-ext">${ICO.ext}</span>` : '';
  const body = `<div class="l-title">${title}${rec}${ext}</div><div class="l-tag">${tag}</div>`;

  if (href) {
    const attrs = external ? `href="${href}" target="_blank" rel="noopener"` : `href="${href}"`;
    return `<a class="l-row" data-type="${e.type}" ${dataUid} ${attrs}>${body}</a>`;
  }
  return `<div class="l-row" data-type="${e.type}" ${dataUid} onclick="openSheet(this.dataset.uid)">${body}</div>`;
}

function buildList() {
  const lView = document.getElementById('lView');
  if (!lView) return;
  const groupBy = activeGroupBy();
  const sorted = k => (DATA[k] || []).filter(e => entryMatches(e)).sort((a, b) => b.day - a.day);

  const allEntries = filteredKeys.flatMap(k => sorted(k));
  if (!allEntries.length) { lView.innerHTML = emptyState(); return; }

  if (groupBy === 'none') {
    lView.innerHTML = allEntries.map(e => listRowHTML(e)).join('');
    return;
  }

  if (groupBy === 'category') {
    const byCat = {};
    allEntries.forEach(e => {
      const cat = e.subCategory || e.category || 'Other';
      if (!byCat[cat]) byCat[cat] = [];
      byCat[cat].push(e);
    });
    lView.innerHTML = Object.keys(byCat).sort().map(cat => {
      return `<div class="l-group"><div class="l-month-label">${cat}</div>${byCat[cat].map(e => listRowHTML(e)).join('')}</div>`;
    }).join('');
    return;
  }

  if (groupBy === 'year') {
    const byYear = {};
    allEntries.forEach(e => {
      const y = ((e.date || '').match(/\d{4}/) || ['—'])[0];
      if (!byYear[y]) byYear[y] = [];
      byYear[y].push(e);
    });
    lView.innerHTML = Object.keys(byYear).sort((a, b) => b.localeCompare(a)).map(y => {
      return `<div class="l-group"><div class="l-month-label">${y}</div>${byYear[y].map(e => listRowHTML(e)).join('')}</div>`;
    }).join('');
    return;
  }

  const CUTOFF = 2022;
  const recentKeys = filteredKeys.filter(k => parseInt(k.split('-')[0], 10) > CUTOFF);
  const oldKeys    = filteredKeys.filter(k => parseInt(k.split('-')[0], 10) <= CUTOFF);

  let html = recentKeys.map(k => {
    const entries = sorted(k);
    if (!entries.length) return '';
    return `<div class="l-group"><div class="l-month-label">${kFull(k)}</div>${entries.map(e => listRowHTML(e)).join('')}</div>`;
  }).join('');

  const oldEntries = oldKeys.flatMap(k => sorted(k));
  if (oldEntries.length) {
    html += `<div class="l-group"><div class="l-month-label">2022 & Earlier</div>${oldEntries.map(e => listRowHTML(e)).join('')}</div>`;
  }
  lView.innerHTML = html;
}


function openEntryByUid(uid) {
  openSheet(uid);
}

document.addEventListener('DOMContentLoaded', () => {
  const listOnly = typeof window.__LISTING__ !== 'undefined' && window.__LISTING__.listOnly;
  if (listOnly) {
    viewMode = 'list';
    document.getElementById('phViewBtn')?.style.setProperty('display', 'none');
    document.getElementById('cardView')?.style.setProperty('display', 'none');
  }
  if (typeof updateFabState !== 'undefined') updateFabState();

  if (typeof window.__SELF_ENTRY__ !== 'undefined') {
    // Permalink page: only this one entry is embedded. Open its modal
    // immediately, then fetch the section's shared (cached) data file in
    // idle time to build the background list — instead of every permalink
    // shipping a full copy of the whole section's data.
    window.DATA = window.DATA || {};
    S[window.__SELF_ENTRY__.uid] = window.__SELF_ENTRY__;
    openSheet(window.__SELF_ENTRY__.uid);
    // openSheet captured window.location.href as the "previous" URL, but on a
    // direct permalink load that IS this page — closing should fall back to
    // the section list instead of re-landing on the same permalink.
    _sheetPrevUrl = '/' + window.__SELF_ENTRY__.uid.split('/')[0] + '/';
    if (window.__DATA_URL__) {
      (window.requestIdleCallback || (fn => setTimeout(fn, 0)))(() => {
        fetch(window.__DATA_URL__).then(r => r.json()).then(data => {
          window.DATA = data;
          Object.values(DATA).forEach(entries => entries.forEach(e => { S[e.uid] = e; }));
          rebuild();
        }).catch(() => {});
      });
    }
  } else if (typeof DATA !== 'undefined') {
    Object.values(DATA).forEach(entries => entries.forEach(e => { S[e.uid] = e; }));
    rebuild();
  } else {
    return;
  }

  window.addEventListener('popstate', () => {
    if (document.getElementById('sheetOverlay')?.classList.contains('open')) {
      closeSheet(true); return;
    }
    rebuild();
  });

  // Latest chip visibility on card view scroll
  const cv = document.getElementById('cardView');
  if (cv) cv.addEventListener('scroll', updateLatest, { passive: true });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeSheet();
      const wrap = document.getElementById('shFilter');
      if (wrap) wrap.dataset.open = 'false';
    }
  });

  window.addEventListener('resize', () => {
    if (viewMode === 'card') show();
  });
});


