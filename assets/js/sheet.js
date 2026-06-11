let _sheetPrevUrl = null;
let _sheetOpen    = false;

function openSheet(uid) {
  const e = S[uid];
  if (!e) return;
  let html = '';

  if (e.type === 'reading') {
    const title   = e.localTitle || e.title;
    const rUrl    = e.link || e.url;
    const coverEl = `<div class="sh-cover-wrap">${e.image ? `<img class="sh-cover" src="${e.image}" alt="${title}">` : `<div class="sh-cover-blank"></div>`}</div>`;
    const meta    = [e.author, e.language, e.genre].filter(Boolean).join(' · ');
    const body    = parseWikilinks(e.content || '');
    const extInd  = rUrl ? `<span class="sh-ext-ind">${ICO.ext}</span>` : '';
    const rowTag  = rUrl ? 'a' : 'div';
    const rowAttr = rUrl ? ` href="${withRef(rUrl)}" target="_blank" rel="noopener"` : '';
    html = `<${rowTag} class="sh-row"${rowAttr}>${coverEl}<div class="sh-info">
      <div class="sh-title">${title}${e.recommended ? ' ✦' : ''}</div>
      <div class="sh-meta">${meta}</div>
      <div class="sh-date">${e.date || ''}</div>
    </div>${extInd}</${rowTag}>
    ${body ? `<div class="sh-rule"></div><div class="sh-body">${body}</div>` : ''}`;
  } else if (e.type === 'bookmarks') {
    const rUrl    = e.href;
    const extInd  = rUrl ? `<span class="sh-ext-ind">${ICO.ext}</span>` : '';
    const rowTag  = rUrl ? 'a' : 'div';
    const rowAttr = rUrl ? ` href="${withRef(rUrl)}" target="_blank" rel="noopener"` : '';
    const coverEl = `<div class="sh-cover-wrap"><div class="sh-bm-icon"><div class="sh-bm-bar"><span class="sh-bm-dot"></span><span class="sh-bm-dot"></span><span class="sh-bm-dot"></span></div></div></div>`;
    html = `<${rowTag} class="sh-row"${rowAttr}>${coverEl}<div class="sh-info">
      <div class="sh-title">${e.title}</div>
      <div class="sh-meta">${e.domain || ''}</div>
      <div class="sh-date">${e.date || ''}</div>
    </div>${extInd}</${rowTag}>
    ${e.content ? `<div class="sh-rule"></div><div class="sh-body">${e.content}</div>` : ''}`;

  } else if (e.type === 'uses') {
    const imgEl   = e.image ? `<img class="sh-cover sh-cover-sq" src="${e.image}" alt="${e.title}">` : `<div class="sh-cover sh-cover-sq"></div>`;
    const coverEl = `<div class="sh-cover-wrap">${imgEl}</div>`;
    const extInd  = e.href ? `<span class="sh-ext-ind">${ICO.ext}</span>` : '';
    const rowTag  = e.href ? 'a' : 'div';
    const rowAttr = e.href ? ` href="${withRef(e.href)}" target="_blank" rel="noopener"` : '';
    html = `<${rowTag} class="sh-row"${rowAttr}>${coverEl}<div class="sh-info">
      <div class="sh-title">${e.title}${e.recommended ? ' ✦' : ''}</div>
      <div class="sh-meta">${e.subCategory || ''}</div>
      <div class="sh-date">${e.date || ''}</div>
    </div>${extInd}</${rowTag}>
    ${e.note ? `<div class="sh-rule"></div><div class="sh-body">${e.note}</div>` : ''}`;

  } else if (e.type === 'projects') {
    const rUrl    = e.permalink || e.href || null;
    const imgEl   = e.cover ? `<img class="sh-cover sh-cover-wide" src="${e.cover}" alt="${e.title}">` : `<div class="sh-cover sh-cover-wide"></div>`;
    const coverEl = `<div class="sh-cover-wrap">${imgEl}</div>`;
    const extInd  = (rUrl && rUrl.startsWith('http')) ? `<span class="sh-ext-ind">${ICO.ext}</span>` : '';
    const rowTag  = rUrl ? 'a' : 'div';
    const rowAttr = rUrl ? ` href="${rUrl}"` : '';
    html = `<${rowTag} class="sh-row"${rowAttr}>${coverEl}<div class="sh-info">
      <div class="sh-title">${e.title}</div>
      ${e.tagline ? `<div class="sh-meta">${e.tagline}</div>` : ''}
      <div class="sh-date">${e.year || e.date || ''}</div>
    </div>${extInd}</${rowTag}>
    ${e.content ? `<div class="sh-rule"></div><div class="sh-body">${e.content}</div>` : ''}`;
  }

  const inner = document.getElementById('sheetInner');
  inner.innerHTML = html;

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

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('sheetInner')?.addEventListener('click', ev => {
    const wl = ev.target.closest('.wikilink[data-uid]');
    if (wl) { ev.preventDefault(); openEntryByUid(wl.dataset.uid); }
  });
});
