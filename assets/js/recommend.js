'use strict';

// Fill this in after deploying the Apps Script (see scripts/recommend-apps-script.gs.js)
// — Deploy > New deployment > Web app > Execute as: Me > Who has access: Anyone,
// then paste the resulting /exec URL here.
const RECOMMEND_ENDPOINT = 'REPLACE_WITH_YOUR_APPS_SCRIPT_URL';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('recommendForm');
  if (!form) return;

  const successEl = document.getElementById('recommendSuccess');
  const errorEl   = document.getElementById('recommendError');

  form.addEventListener('submit', e => {
    e.preventDefault();
    errorEl.hidden = true;

    // Honeypot — a real visitor never sees or fills this field.
    if (form.website.value) return;

    const recommendation = form.recommendation.value.trim();
    if (!recommendation) return;

    const btn = form.querySelector('.recommend-submit');
    btn.disabled = true;
    btn.textContent = 'Sending…';

    fetch(RECOMMEND_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify({
        recommendation,
        name: form.name.value.trim(),
        contact: form.contact.value.trim(),
      }),
    })
      .then(res => {
        if (!res.ok) throw new Error('bad response');
        form.hidden = true;
        successEl.hidden = false;
      })
      .catch(() => {
        errorEl.hidden = false;
        btn.disabled = false;
        btn.textContent = 'Send';
      });
  });
});
