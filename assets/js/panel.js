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
  const coverEl = e.image ? `<div class="sp-cover"><img src="${e.image}" alt=""></div>` : '';
  const yearEl  = e.year ? `<div class="sp-updated">${e.year}</div>` : '';
  const body    = parseWikilinks(e.content || '');

  const spBody = document.getElementById('spBody');
  spBody.innerHTML = `
    ${coverEl}
    <div class="sp-title">${e.title}</div>
    ${yearEl}
    <hr class="sp-rule">
    <div class="sp-text">${body}</div>
  `;
  spBody.scrollTop = 0;
  _attachPanelLinkHandlers();

  if (!_panelOpen) {
    _panelPrevUrl = window.location.href;
    history.pushState({ panel: uid }, '', `/${uid}/`);
  } else {
    history.replaceState({ panel: uid }, '', `/${uid}/`);
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

function _makeLinksExternal(container) {
  container.querySelectorAll('a[href^="http"]').forEach(a => {
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener');
  });
}

function _attachPanelLinkHandlers() {
  document.getElementById('spBody').addEventListener('click', ev => {
    const wl = ev.target.closest('.wikilink[data-uid]');
    if (wl) { ev.preventDefault(); openEntryByUid(wl.dataset.uid); }
    const bl = ev.target.closest('.sp-backlink-item[data-uid]');
    if (bl) { ev.preventDefault(); openEntryByUid(bl.dataset.uid); }
  }, { once: true });
}
