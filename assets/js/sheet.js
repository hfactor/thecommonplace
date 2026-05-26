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
    const bExtIcon = e.href ? `<span class="ext-badge sh-ext">${ICO.ext}</span>` : '';
    html = `<a class="sh-row" href="${bUrl}" target="_blank" rel="noopener"><div class="sh-info">
      <div class="sh-title">${e.title}</div>
      <div class="sh-meta">${e.domain || ''}</div>
      <div class="sh-date">${e.date || ''}</div>
    </div>${bExtIcon}</a>
    <div class="sh-rule"></div>
    <div class="sh-body">${e.content || ''}</div>`;

  } else if (e.type === 'uses') {
    const img = e.image
      ? `<img class="sh-cover sh-cover-sq" src="${e.image}" alt="${e.title}">`
      : `<div class="sh-cover sh-cover-sq"></div>`;
    const extIcon = e.href ? `<span class="ext-badge sh-ext">${ICO.ext}</span>` : '';
    const rowTag  = e.href ? 'a' : 'div';
    const rowAttr = e.href ? ` href="${withRef(e.href)}" target="_blank" rel="noopener"` : '';
    const meta    = [e.subCategory, e.date].filter(Boolean).join(' · ');
    html = `<${rowTag} class="sh-row"${rowAttr}>${img}<div class="sh-info">
      <div class="sh-title">${e.title}${e.recommended ? ' ✦' : ''}</div>
      <div class="sh-meta">${meta}</div>
    </div>${extIcon}</${rowTag}>
    ${e.note ? `<div class="sh-rule"></div><div class="sh-body">${e.note}</div>` : ''}`;

  } else if (e.type === 'projects') {
    const img = e.cover
      ? `<img class="sh-cover sh-cover-wide" src="${e.cover}" alt="${e.title}">`
      : `<div class="sh-cover sh-cover-wide"></div>`;
    const rUrl    = e.permalink || e.href || null;
    const extIcon = rUrl ? `<span class="ext-badge sh-ext">${ICO.ext}</span>` : '';
    const rowTag  = rUrl ? 'a' : 'div';
    const rowAttr = rUrl ? ` href="${rUrl}"` : '';
    html = `<${rowTag} class="sh-row"${rowAttr}>${img}<div class="sh-info">
      <div class="sh-title">${e.title}</div>
      ${e.tagline ? `<div class="sh-meta">${e.tagline}</div>` : ''}
      <div class="sh-date">${e.year || e.date || ''}</div>
    </div>${extIcon}</${rowTag}>
    ${e.content ? `<div class="sh-rule"></div><div class="sh-body">${e.content}</div>` : ''}`;
  }

  const inner = document.getElementById('sheetInner');
  inner.innerHTML = html;
  inner.addEventListener('click', ev => {
    const wl = ev.target.closest('.wikilink[data-uid]');
    if (wl) { ev.preventDefault(); openEntryByUid(wl.dataset.uid); }
  }, { once: true });

  // Only push/replace URL when there's a real permalink to navigate to
  const permalink = e.permalink || null;
  if (permalink) {
    if (!_sheetOpen) {
      _sheetPrevUrl = window.location.href;
      history.pushState({ sheet: uid }, '', permalink);
    } else {
      history.replaceState({ sheet: uid }, '', permalink);
    }
  } else if (!_sheetOpen) {
    _sheetPrevUrl = null; // nothing to restore on close
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
