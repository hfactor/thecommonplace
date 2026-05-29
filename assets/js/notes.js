'use strict';

function _isNotesPage() {
  return !!document.querySelector('.app[data-page="notes"]');
}

function renderNoteWikilinks() {
  const content = document.querySelector('.note-content');
  if (!content) return;

  // Notes lookup: title → url
  const notesLookup = {};
  if (typeof NOTES_DATA !== 'undefined') {
    NOTES_DATA.forEach(n => { notesLookup[n.title.toLowerCase()] = n.url; });
  }

  // Cross-section lookup: title → entry; populate global S so openSheet() works
  const crossLookup = {};
  if (typeof CROSS_DATA !== 'undefined') {
    Object.values(CROSS_DATA).forEach(e => {
      crossLookup[(e.title || '').toLowerCase()] = e;
      if (e.localTitle) crossLookup[e.localTitle.toLowerCase()] = e;
      S[e.uid] = e;
    });
  }

  content.innerHTML = content.innerHTML.replace(/\[\[([^\]]+)\]\]/g, (_, title) => {
    const key = title.toLowerCase();
    if (notesLookup[key]) {
      return `<a class="wikilink" href="${notesLookup[key]}">${title}</a>`;
    }
    if (crossLookup[key]) {
      const uid = crossLookup[key].uid;
      return `<span class="wikilink" data-uid="${uid}" onclick="openSheet('${uid}')">${title}</span>`;
    }
    return `<span class="wikilink-dead">${title}</span>`;
  });
}

function fabRandomNote() {
  if (typeof NOTES_DATA === 'undefined' || !NOTES_DATA.length) return;
  const current = window.location.pathname.replace(/\/$/, '');
  let pool = NOTES_DATA.filter(n => n.url.replace(/\/$/, '') !== current);
  if (!pool.length) pool = NOTES_DATA;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  window.location.href = pick.url;
}

function fabNotesSearch() {
  const modal = document.getElementById('notesSearchModal');
  if (!modal) return;
  modal.classList.add('open');
  const input = document.getElementById('notesSearchInput');
  if (input) { input.value = ''; _renderNotesResults(''); input.focus(); }
}

function closeNotesSearch() {
  document.getElementById('notesSearchModal')?.classList.remove('open');
}

function _renderNotesResults(query) {
  const container = document.getElementById('notesSearchResults');
  if (!container || typeof NOTES_DATA === 'undefined') return;
  const q = query.toLowerCase().trim();
  const results = q
    ? NOTES_DATA.filter(n => n.title.toLowerCase().includes(q))
    : NOTES_DATA;
  container.innerHTML = results.length
    ? results.map(n => `<a class="nsm-item" href="${n.url}">${n.title}</a>`).join('')
    : `<div class="nsm-empty">No results</div>`;
}

document.addEventListener('DOMContentLoaded', () => {
  if (!_isNotesPage()) return;

  renderNoteWikilinks();

  const input = document.getElementById('notesSearchInput');
  if (input) input.addEventListener('input', e => _renderNotesResults(e.target.value));

  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); fabNotesSearch(); }
    if (e.key === 'Escape') closeNotesSearch();
  });
});
