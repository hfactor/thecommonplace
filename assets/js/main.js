// DATA and PAGE_CONTENT are injected by Hugo via list.html

const S = {};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const kFull  = k => { const [y,m] = k.split('-'); return `${MONTHS[+m-1]} ${y}`; };

let viewMode = 'card';
let activeFilter = () => true;
let filteredKeys = [];
let currentIdx = 0;

const isPanel = e => false;
const isRec   = e => e.recommended;

function entryMatches(e) {
  if (!activeFilter(e)) return false;
  if (recFilter && !isRec(e)) return false;
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    const haystack = [e.title, e.author, e.summary, e.domain, e.meta, e.subCategory].filter(Boolean).join(' ').toLowerCase();
    if (!haystack.includes(q)) return false;
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
  const allKeys = Object.keys(DATA).sort().reverse();
  filteredKeys = allKeys.filter(k => (DATA[k] || []).some(e => entryMatches(e)));
  currentIdx = 0;
  buildMobile();
  buildDesktop();
  show();
  updateLatest();
}

function show() {
  const mWrap = document.getElementById('mWrap');
  const dCols = document.getElementById('dCols');
  const lView = document.getElementById('lView');
  const desk  = window.innerWidth >= 640;
  if (viewMode === 'list') {
    mWrap.style.display = 'none'; dCols.style.display = 'none'; lView.style.display = 'block';
    buildList();
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

function cardHTML(e, idx) {
  const uid   = e.uid;
  const si    = `style="--i:${idx || 0}"`;
  const recEl = isRec(e) ? `<span class="card-rec">✦</span>` : '';

  if (e.type === 'reading') {
    const title = e.localTitle || e.title;
    const img   = e.image
      ? `<img class="card-cover-img" src="${e.image}" alt="${title}">`
      : `<div class="card-cover-blank"></div>`;
    return `<div class="card" data-uid="${uid}" ${si} onclick="openSheet(this.dataset.uid)"><div class="card-cover">${img}<div class="card-spine"></div></div><div class="card-below"><span class="card-title">${title}</span>${recEl}</div></div>`;
  }

  if (e.type === 'bookmarks') {
    const noteEl = e.summary ? `<div class="bm-note">${e.summary}</div>` : '';
    const dots   = `<div class="bm-dots"><span></span><span></span><span></span></div>`;
    return `<div class="card" data-uid="${uid}" ${si} onclick="openSheet(this.dataset.uid)"><div class="bm-card"><div class="bm-bar">${dots}<span class="bm-url">${e.domain || ''}</span><a class="bm-ext" href="${withRef(e.href)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${ICO.ext}</a></div><div class="bm-body"><div class="bm-title">${e.title}</div>${noteEl}</div></div></div>`;
  }

  if (e.type === 'newsletter') {
    const rots = [-2.8, -2.0, -1.4, 1.2, 1.8, 2.6];
    const rh   = [...uid].reduce((a, c) => a + c.charCodeAt(0), 0);
    const rot  = rots[rh % rots.length];
    const img  = e.image ? `<img class="nl-card-img" src="${e.image}" alt="">` : `<div class="nl-card-blank"></div>`;
    return `<a class="card nl-card-wrap" href="${withRef(e.url)}" target="_blank" rel="noopener" style="--i:${idx||0};--rot:${rot}deg"><div class="nl-card">${img}</div><span class="nl-card-ext">${ICO.ext}</span></a>`;
  }

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
  bookmarks:  () => 'Bookmark',
  newsletter: () => 'Newsletter',
};
function buildList() {
  const hasAny = filteredKeys.some(k => (DATA[k] || []).some(e => entryMatches(e)));
  if (!hasAny) { document.getElementById('lView').innerHTML = emptyState(); return; }
  document.getElementById('lView').innerHTML = filteredKeys.map(k => {
    const entries = (DATA[k] || []).filter(e => entryMatches(e)).sort((a, b) => a.day - b.day);
    if (!entries.length) return '';
    const rows = entries.map((e, i) => {
      S[e.uid] = e;
      const title   = e.localTitle || e.title || '';
      const tag     = (LIST_TAG[e.type] || (() => ''))(e);
      const rec     = isRec(e) ? ' ✦' : '';
      const isExt   = e.type === 'newsletter' || e.type === 'bookmarks';
      const extIcon = isExt ? `<span class="l-ext">${ICO.ext}</span>` : '';
      const action  = e.type === 'newsletter' ? `window.open('${withRef(e.url)}','_blank')`
                    : isPanel(e) ? `openPanel(this.dataset.uid)` : `openSheet(this.dataset.uid)`;
      const tipWide = ['notes','projects','bookmarks','newsletter'].includes(e.type) ? 'wide' : '';
      const dataImg = e.image ? `data-img="${e.image}" data-wide="${tipWide}"` : '';
      const dataUid = `data-uid="${e.uid}"`;

      // Newsletter: title left, "Month Year" right with arrow (arrow animates in on hover)
      if (e.type === 'newsletter') {
        const nlTitle = title || e.url;
        return `<div class="l-row" data-type="newsletter" ${dataUid} ${dataImg} style="--i:${i}" onclick="${action}"><div class="l-title">${nlTitle}${extIcon}</div><div class="l-tag">Newsletter</div></div>`;
      }

      return `<div class="l-row" ${dataUid} ${dataImg} style="--i:${i}" onclick="${action}"><div class="l-title">${title}${rec}${extIcon}</div><div class="l-tag">${tag}</div></div>`;
    }).join('');
    return `<div><div class="l-month-label">${kFull(k)}</div>${rows}</div>`;
  }).join('');
}

function openEntryByUid(uid) {
  const e = S[uid];
  if (!e) return;
  if (isPanel(e)) openPanel(uid); else openSheet(uid);
}

document.addEventListener('DOMContentLoaded', () => {
  if (typeof DATA === 'undefined') return;
  Object.values(DATA).forEach(entries => entries.forEach(e => { S[e.uid] = e; }));
  const _pathFilter = PATH_TO_FILTER[window.location.pathname.replace(/\/$/, '')];
  if (_pathFilter) {
    activePills.add(_pathFilter);
    buildActiveFilter();
    _syncFilterItems();
  }
  rebuild();

  if (typeof window.__OPEN_UID__ !== 'undefined') {
    openSheet(window.__OPEN_UID__);
  }

  window.addEventListener('popstate', () => {
    if (document.getElementById('sidePanel').classList.contains('open')) {
      closePanel(true);
      return;
    }
    if (document.getElementById('sheetOverlay').classList.contains('open')) {
      closeSheet(true);
      return;
    }
    activePills.clear();
    const f = PATH_TO_FILTER[window.location.pathname.replace(/\/$/, '')];
    if (f) activePills.add(f);
    buildActiveFilter();
    _syncFilterItems();
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
      imgDiv.className = 'l-tip-img' + (row.dataset.wide === 'wide' ? ' wide' : '');
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
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); fabToggleFilter(); }
    if (e.key === 'Escape') { closeSheet(); closePanel(); }
  });

  window.addEventListener('resize', () => {
    if (viewMode === 'card') show();
  });
});
