function parseWikilinks(html) {
  return html.replace(/\[\[([^\]]+)\]\]/g, (_, title) => {
    const key   = title.toLowerCase();
    const entry = Object.values(S).find(e =>
      (e.title || '').toLowerCase() === key ||
      (e.localTitle || '').toLowerCase() === key
    );
    if (!entry) return `<span class="wikilink-dead">${title}</span>`;
    const label = entry.localTitle || title;
    return `<span class="wikilink" data-uid="${entry.uid}">${label}</span>`;
  });
}

let _sheetPrevUrl    = null;
let _sheetOpen       = false;
let _sheetScrollLeft = null;

function metaLink(value, type, extraClass) {
  if (!value) return '';
  const url = `/${type}/?q=${encodeURIComponent(value)}`;
  const cls = extraClass ? `modal-meta-tag ${extraClass}` : 'modal-meta-tag';
  return `<a class="${cls}" href="${url}">${value}</a>`;
}

function recPill(e, type) {
  if (!e.recommended) return '';
  const url = `/${type}/?q=recommended`;
  return `<a class="modal-meta-tag modal-meta-tag--rec" href="${url}">✦ Recommended</a>`;
}

function openSheet(uid) {
  const e = S[uid];
  if (!e) return;
  let html = '';
  let wide = false;

  if (e.type === 'reading') {
    wide = true;
    const title  = e.localTitle || e.title;
    const rUrl   = e.link || e.url;
    const metaParts = [e.author, e.language, e.genre].filter(Boolean)
      .map(v => metaLink(v, 'reading')).join('');
    const recTag = recPill(e, 'reading');
    const body   = parseWikilinks(e.content || '');
    const coverInner = e.image
      ? `<img class="modal-cover-img" src="${e.image}" alt="${title}">`
      : `<div class="modal-cover-blank"></div>`;
    const coverWrap = `<div class="modal-book-3d"><div class="modal-book-pages"></div>${coverInner}<div class="modal-book-spine"></div></div>`;
    const coverCol = rUrl
      ? `<a class="modal-cover-col modal-cover-link" href="${withRef(rUrl)}" target="_blank" rel="noopener">${coverWrap}</a>`
      : `<div class="modal-cover-col">${coverWrap}</div>`;
    const extBadge = rUrl ? `<a class="modal-ext-standalone" href="${withRef(rUrl)}" target="_blank" rel="noopener">${ICO.ext}</a>` : '';
    const titleEl = `<div class="modal-title-row">` +
      (rUrl ? `<a class="modal-title modal-title--link" href="${withRef(rUrl)}" target="_blank" rel="noopener">${title}</a>` : `<span class="modal-title">${title}</span>`) +
      extBadge +
      `</div>`;
    const dateEl = e.date
      ? (e.permalink ? `<a class="modal-date-inline" href="${e.permalink}">${e.date}</a>` : `<div class="modal-date-inline">${e.date}</div>`)
      : '';
    html = `<div class="modal-book">
      ${coverCol}
      <div class="modal-body-col">
        <div class="modal-type-badge">Reading</div>
        ${titleEl}
        <div class="modal-meta">${metaParts}${recTag}</div>
        ${body ? `<div class="modal-body">${body}</div>` : ''}
        ${dateEl}
      </div>
    </div>`;

  } else if (e.type === 'bookmarks') {
    const rUrl  = e.href;
    const body  = parseWikilinks(e.content || '');
    const dots  = `<div class="bm-dots"><span></span><span></span><span></span></div>`;
    const dateEl = e.date
      ? `<div class="modal-date-inline">${e.date}</div>`
      : '';
    const bodyTag   = rUrl ? 'a' : 'div';
    const bodyAttrs = rUrl ? ` href="${withRef(rUrl)}" target="_blank" rel="noopener"` : '';
    html = `<div class="modal-bm">
      <div class="modal-bm-bar">${dots}<span class="modal-bm-url">${e.domain || ''}</span></div>
      <${bodyTag} class="modal-body-col modal-body-col--link"${bodyAttrs}>
        <div class="modal-type-badge">Bookmark</div>
        <div class="modal-title">${e.title} ${rUrl ? ICO.ext : ''}</div>
        ${body ? `<div class="modal-body">${body}</div>` : ''}
        ${dateEl}
      </${bodyTag}>
    </div>`;

  } else if (e.type === 'uses') {
    wide = true;
    const imgEl = e.image
      ? `<img class="modal-uses-img" src="${e.image}" alt="${e.title}">`
      : `<div class="modal-uses-img-blank"></div>`;
    const imgWrapped = e.href
      ? `<a class="modal-cover-link" href="${withRef(e.href)}" target="_blank" rel="noopener">${imgEl}<span class="modal-ext-badge">${ICO.ext}</span></a>`
      : imgEl;
    const usesTitleEl = e.href
      ? `<a class="modal-title modal-title--link" href="${withRef(e.href)}" target="_blank" rel="noopener">${e.title} ${ICO.ext}</a>`
      : `<div class="modal-title">${e.title}</div>`;
    const dateEl = e.date ? `<div class="modal-date-inline">${e.date}</div>` : '';
    html = `<div class="modal-uses">
      <div class="modal-uses-img-col">${imgWrapped}</div>
      <div class="modal-body-col">
        <div class="modal-type-badge">Uses</div>
        ${usesTitleEl}
        <div class="modal-meta">${[metaLink(e.subCategory, 'uses'), recPill(e, 'uses')].filter(Boolean).join('')}</div>
        ${e.note ? `<div class="modal-body">${e.note}</div>` : ''}
        ${dateEl}
      </div>
    </div>`;
  }

  const inner   = document.getElementById('sheetInner');
  const sheet   = document.getElementById('sheet');
  inner.innerHTML = html;
  sheet.classList.toggle('sheet--wide', wide);

  if (!_sheetOpen) {
    const cv = document.getElementById('cardView');
    _sheetScrollLeft = cv ? cv.scrollLeft : null;
  }

  const permalink = e.permalink || null;
  if (permalink) {
    if (!_sheetOpen) {
      _sheetPrevUrl = window.location.href;
      history.pushState({ sheet: uid }, '', permalink);
    } else {
      history.replaceState({ sheet: uid }, '', permalink);
    }
  } else if (!_sheetOpen) {
    _sheetPrevUrl = null;
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
  if (_sheetScrollLeft !== null) {
    const cv = document.getElementById('cardView');
    if (cv) cv.scrollLeft = _sheetScrollLeft;
    _sheetScrollLeft = null;
  }
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
