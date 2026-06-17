'use strict';

/* ── Shared helpers ─────────────────────────────── */

function _isNotesPage() {
  return !!document.querySelector('.app[data-page="notes"]');
}

function fabRandomNote() {
  if (typeof NOTES_DATA === 'undefined' || !NOTES_DATA.length) return;
  const pick = NOTES_DATA[Math.floor(Math.random() * NOTES_DATA.length)];
  if (document.getElementById('nlTrack') && S[pick.uid]) {
    openPanel(pick.uid);
  } else {
    window.location.href = pick.url;
  }
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

/* ── Notes list (list page only) ────────────────── */

function initNoteList() {
  if (typeof NOTES_DATA === 'undefined' || !NOTES_DATA.length) return;

  NOTES_DATA.forEach(n => { S[n.uid] = Object.assign({}, n, { type: 'notes' }); });

  const trackEl = document.getElementById('nlTrack');
  const wrapEl  = document.getElementById('nlTrackWrap');
  if (!trackEl || !wrapEl) return;

  const VH     = wrapEl.clientHeight || window.innerHeight;
  const N      = NOTES_DATA.length;
  const ITEM_H = 56; // must match .nl-item { height: 56px } in CSS

  const LIST_H = N * ITEM_H;

  NOTES_DATA.forEach(note => {
    const el = document.createElement('button');
    el.className = 'nl-item';
    el.textContent = note.title;
    el.dataset.uid  = note.uid;
    trackEl.appendChild(el);
  });

  trackEl.style.height = `${LIST_H}px`;

  const CY      = VH / 2 - ITEM_H / 2;
  const maxOff  = CY;
  const minOff  = CY - (N - 1) * ITEM_H;
  let offset    = CY;

  let vel      = 0;
  const FRICTION = 0.90;

  function tick() {
    vel    *= FRICTION;
    offset += vel;
    if (offset > maxOff) { offset = maxOff; vel = 0; }
    if (offset < minOff) { offset = minOff; vel = 0; }
    trackEl.style.transform = `translateY(${offset}px)`;
    requestAnimationFrame(tick);
  }

  // Wheel: push velocity
  wrapEl.addEventListener('wheel', e => {
    e.preventDefault();
    vel -= e.deltaY * 0.35;
  }, { passive: false });

  // Touch drag
  let prevTY = 0;
  wrapEl.addEventListener('touchstart',
    e => { prevTY = e.touches[0].clientY; }, { passive: true });
  wrapEl.addEventListener('touchmove', e => {
    const dy = e.touches[0].clientY - prevTY;
    prevTY   = e.touches[0].clientY;
    vel     += dy * 0.4;
  }, { passive: true });

  // Click → side panel
  trackEl.addEventListener('click', e => {
    const item = e.target.closest('.nl-item');
    if (!item || !item.dataset.uid) return;
    openPanel(item.dataset.uid);
  });

  requestAnimationFrame(tick);
}

/* ── DOMContentLoaded entry ─────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  if (!_isNotesPage()) return;

  if (!document.getElementById('nlTrack')) return;
  initNoteList();
  const pending = sessionStorage.getItem('openNote');
  if (pending && S[pending]) {
    sessionStorage.removeItem('openNote');
    openPanel(pending);
  }

  const input = document.getElementById('notesSearchInput');
  if (input) input.addEventListener('input', e => _renderNotesResults(e.target.value));

  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); fabNotesSearch(); }
    if (e.key === 'Escape') closeNotesSearch();
  });
});
