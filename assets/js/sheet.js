let _sheetPrevUrl = null;
let _sheetOpen    = false;

function openSheet(uid) {
  const e = S[uid];
  if (!e) return;
  let html = '';
  const extEl = url => url ? `<a class="ext-badge sh-ext" href="${withRef(url)}" target="_blank" rel="noopener">${ICO.ext}</a>` : '';

  if (e.type === 'reading') {
    const title   = e.localTitle || e.title;
    const coverEl = e.image
      ? `<img class="sh-cover" src="${e.image}" alt="${title}">`
      : `<div class="sh-cover-blank"></div>`;
    const meta = [e.author, e.language, e.genre].filter(Boolean).join(' · ');
    const body = parseWikilinks(e.content || '');
    const rUrl = e.link || e.url;
    // Use <span> for icon so there's no nested <a> inside the row link
    const rExtIcon = rUrl ? `<span class="ext-badge sh-ext">${ICO.ext}</span>` : '';
    const rowTag = rUrl ? `a` : `div`;
    const rowAttr = rUrl ? ` href="${withRef(rUrl)}" target="_blank" rel="noopener"` : ``;
    html = `<${rowTag} class="sh-row"${rowAttr}>${coverEl}<div class="sh-info">
      <div class="sh-title">${title}${e.recommended ? ' ✦' : ''}</div>
      ${e.localTitle ? `<div class="sh-meta" style="font-style:italic;">${e.title}</div>` : ''}
      <div class="sh-meta">${meta}</div>
      <div class="sh-date">${e.date || ''}</div>
    </div>${rExtIcon}</${rowTag}>
    <div class="sh-rule"></div>
    <div class="sh-body">${body}</div>`;
  } else if (e.type === 'bookmarks') {
    const bUrl = withRef(e.href);
    // Whole row is the link — use a <span> for the icon so there's no nested <a>
    const bExtIcon = e.href ? `<span class="ext-badge sh-ext">${ICO.ext}</span>` : '';
    html = `<a class="sh-row" href="${bUrl}" target="_blank" rel="noopener"><div class="sh-info">
      <div class="sh-title">${e.title}</div>
      <div class="sh-meta">${e.domain || ''}</div>
      <div class="sh-date">${e.date || ''}</div>
    </div>${bExtIcon}</a>
    <div class="sh-rule"></div>
    <div class="sh-body">${e.content || ''}</div>`;
  }

  const inner = document.getElementById('sheetInner');
  inner.innerHTML = html;
  inner.addEventListener('click', ev => {
    const wl = ev.target.closest('.wikilink[data-uid]');
    if (wl) { ev.preventDefault(); openEntryByUid(wl.dataset.uid); }
  }, { once: true });

  const permalink = e.permalink || `/${uid}/`;
  if (!_sheetOpen) {
    _sheetPrevUrl = window.location.href;
    history.pushState({ sheet: uid }, '', permalink);
  } else {
    history.replaceState({ sheet: uid }, '', permalink);
  }
  _sheetOpen = true;
  document.getElementById('sheetOverlay').classList.add('open');
}

function closeSheet(fromPopstate = false) {
  _sheetOpen = false;
  if (_sheetPrevUrl) {
    if (!fromPopstate) history.replaceState({}, '', _sheetPrevUrl);
    _sheetPrevUrl = null;
  }
  document.getElementById('sheetOverlay').classList.remove('open');
}

function closeSheetOutside(ev) {
  if (ev.target === document.getElementById('sheetOverlay')) closeSheet();
}
