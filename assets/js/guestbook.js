'use strict';

// Fill this in after deploying the Apps Script (see scripts/guestbook-apps-script.gs.js)
// — Deploy > New deployment > Web app > Execute as: Me > Who has access: Anyone,
// then paste the resulting /exec URL here.
const GUESTBOOK_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxVz6lLNgbQlFV0p2fPbqiZI9wUTdtZCrBAMKTvo-ygVDfvYd7uU1OxVC8FwRfAaFU87Q/exec';

document.addEventListener('DOMContentLoaded', () => {
  const form    = document.getElementById('guestbookForm');
  const list    = document.getElementById('guestbookList');
  const addBtn  = document.getElementById('gbAddBtn');
  const cancelBtn = document.getElementById('gbCancelBtn');
  if (!form || !list || !addBtn) return;

  const errorEl = document.getElementById('guestbookError');

  function showCompose() {
    addBtn.hidden = true;
    form.hidden = false;
    form.querySelector('textarea').focus();
  }
  function hideCompose() {
    form.hidden = true;
    addBtn.hidden = false;
  }
  addBtn.addEventListener('click', showCompose);
  cancelBtn.addEventListener('click', () => { form.reset(); hideCompose(); });

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function renderEntries(entries) {
    if (!entries.length) {
      list.innerHTML = '<p class="guestbook-empty">No notes yet — be the first.</p>';
      return;
    }
    list.innerHTML = entries.map(entry => {
      const d = new Date(entry.date);
      const date = [d.getDate(), d.getMonth() + 1, d.getFullYear()]
        .map((n, i) => i < 2 ? String(n).padStart(2, '0') : n)
        .join('/');
      let meta = date;
      if (entry.name) {
        const nameText = escapeHTML(entry.name);
        const name = entry.website
          ? `<a href="${escapeHTML(entry.website)}" target="_blank" rel="noopener nofollow">${nameText}</a>`
          : nameText;
        meta = `${name} · ${date}`;
      }
      return `<div class="gb-note">
        <p class="gb-note-message">${escapeHTML(entry.message)}</p>
        <p class="gb-note-meta">${meta}</p>
      </div>`;
    }).join('');
  }

  // Entries and the add-tile appear together, once loading is done, rather
  // than the add-tile popping in immediately while notes lag behind it.
  function loadEntries() {
    return fetch(GUESTBOOK_ENDPOINT)
      .then(res => res.json())
      .then(renderEntries)
      .catch(() => { list.innerHTML = '<p class="guestbook-empty">Couldn’t load notes right now.</p>'; });
  }

  loadEntries().finally(() => { addBtn.hidden = false; });

  form.addEventListener('submit', e => {
    e.preventDefault();
    errorEl.hidden = true;

    // Honeypot — a real visitor never sees or fills this field.
    if (form.company.value) return;

    const message = form.message.value.trim();
    if (!message) return;

    const btn = form.querySelector('.gb-post-btn');
    btn.disabled = true;
    btn.textContent = 'Posting…';

    fetch(GUESTBOOK_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify({
        message,
        name: form.name.value.trim(),
        website: form.website.value.trim(),
      }),
    })
      .then(res => {
        if (!res.ok) throw new Error('bad response');
        form.reset();
        hideCompose();
        loadEntries();
      })
      .catch(() => { errorEl.hidden = false; })
      .finally(() => {
        btn.disabled = false;
        btn.textContent = 'Post it';
      });
  });
});
