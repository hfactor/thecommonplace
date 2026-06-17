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


let _panelPrevUrl = null;
let _panelOpen    = false;

function openPanel(uid) {
  const e = S[uid];
  if (!e) return;

  let html;
  if (e.type === 'notes') {
    const body = parseWikilinks(e.content || '');
    let blHtml = '';
    if (e.backlinks && e.backlinks.length) {
      const items = e.backlinks.map(b =>
        `<span class="note-backlink-item" data-uid="${b.uid}">${b.title}</span>`
      ).join('');
      blHtml = `<div class="note-backlinks"><div class="note-backlinks-label">Linked from</div><div class="note-backlinks-grid">${items}</div></div>`;
    }
    html = `
      <div class="sp-title">${e.title}</div>
      ${body ? `<hr class="sp-rule"><div class="sp-text">${body}</div>` : ''}
      ${blHtml}
      ${e.date ? `<div class="sp-notes-date">Last updated ${e.date}</div>` : ''}
    `;
  } else {
    const coverEl = e.image ? `<div class="sp-cover"><img src="${e.image}" alt=""></div>` : '';
    const yearEl  = e.year ? `<div class="sp-updated">${e.year}</div>` : '';
    const body    = parseWikilinks(e.content || '');
    html = `
      ${coverEl}
      <div class="sp-title">${e.title}</div>
      ${yearEl}
      <hr class="sp-rule">
      <div class="sp-text">${body}</div>
    `;
  }

  const spBody = document.getElementById('spBody');
  spBody.innerHTML = html;
  spBody.scrollTop = 0;
  _attachPanelLinkHandlers();

  const pushUrl = e.type === 'notes' ? (e.url || null) : `/${uid}/`;
  if (pushUrl) {
    if (!_panelOpen) {
      _panelPrevUrl = window.location.href;
      history.pushState({ panel: uid }, '', pushUrl);
    } else {
      history.replaceState({ panel: uid }, '', pushUrl);
    }
  }

  _panelOpen = true;
  document.getElementById('panelOverlay').classList.add('open');
  document.getElementById('sidePanel').classList.add('open');
}

function closePanel(fromPopstate = false) {
  _panelOpen = false;
  if (_panelPrevUrl) {
    if (!fromPopstate) history.replaceState({}, '', _panelPrevUrl);
    _panelPrevUrl = null;
  }
  document.getElementById('panelOverlay').classList.remove('open');
  document.getElementById('sidePanel').classList.remove('open');
}

let _panelHandlerReady = false;
function _attachPanelLinkHandlers() {
  if (_panelHandlerReady) return;
  _panelHandlerReady = true;
  document.getElementById('spBody').addEventListener('click', ev => {
    const wl = ev.target.closest('.wikilink[data-uid]');
    if (wl) { ev.preventDefault(); openEntryByUid(wl.dataset.uid); return; }
    const bl = ev.target.closest('.note-backlink-item[data-uid]');
    if (bl) { ev.preventDefault(); openEntryByUid(bl.dataset.uid); }
  });
}
