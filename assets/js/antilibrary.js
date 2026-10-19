'use strict';

// Fill this in after deploying the Apps Script (see scripts/antilibrary-apps-script.gs.js)
// — Deploy > New deployment > Web app > Execute as: Me > Who has access: Anyone,
// then paste the /exec URL (or just the deployment ID) here. Until then the list
// stays empty and adding says it isn't switched on yet.
const ANTILIBRARY_DEPLOYMENT = 'AKfycbxGtT6CeMokq8uAKwGOWfjbjhhT2z2ho4x7W6Zl6TEBGAoqb_TZ_g55XjaPPyqCK-vPTw';

document.addEventListener('DOMContentLoaded', () => {
  const items = document.getElementById('alItems');
  const form  = document.getElementById('alForm');
  const msg   = document.getElementById('alMsg');
  const empty = document.getElementById('alEmpty');
  if (!items || !form) return;

  const live = ANTILIBRARY_DEPLOYMENT !== 'REPLACE_WITH_YOUR_APPS_SCRIPT_URL';
  const ANTILIBRARY_ENDPOINT = ANTILIBRARY_DEPLOYMENT.startsWith('http')
    ? ANTILIBRARY_DEPLOYMENT
    : `https://script.google.com/macros/s/${ANTILIBRARY_DEPLOYMENT}/exec`;
  // Labels come from the template so server- and JS-rendered rows agree.
  const STATUS_LABEL = window.AL_LABELS || { suggested: 'Suggested', collected: 'Collected', completed: 'Completed' };

  // The title row depends on the type; Link has none (the link is the entry).
  // Every other type can carry an optional link too.
  const KINDS = {
    'Book':        { f1: 'Title', f2: 'Author' },
    'Film/Series': { f1: 'Title', f2: 'OTT or director' },
    'Link':        null,
    'Other':       { f1: 'Title', f2: 'Comment' },
  };

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // The sheet is publicly writable, so link cells are not trusted: only a
  // path on this site or an http(s) address ever becomes a link.
  function safeLink(url) {
    url = (url || '').trim();
    return /^\/(?!\/)/.test(url) || /^https?:\/\//.test(url) ? url : '';
  }
  // The site's standard external-link arrow (ICO in theme.js, styled by .l-ext).
  const extIcon = () => `<span class="l-ext" aria-hidden="true">${typeof ICO !== 'undefined' ? ICO.ext : ''}</span>`;

  function itemHTML(e) {
    const st = STATUS_LABEL[e.status] ? e.status : 'suggested';
    const kind = e.kind in KINDS ? e.kind : 'Other';
    // link = the visitor's own link, which goes on their name; for the Link type
    //        it's the page they recommended, so it goes on the title instead.
    // url  = my page about it (hiran.in); it makes the title a link once completed.
    const own = safeLink(e.link);
    const log = st === 'completed' ? safeLink(e.url) : '';
    const isLink = kind === 'Link';
    const label = escapeHTML(e.title);
    const title = log
      ? `<a class="al-title" href="${escapeHTML(log)}">${label}${extIcon()}</a>`
      : isLink && own
        ? `<a class="al-title" href="${escapeHTML(own)}" target="_blank" rel="noopener nofollow">${label}${extIcon()}</a>`
        : `<span class="al-title">${label}</span>`;
    const name = escapeHTML(e.recommendedBy || '');
    const nameHTML = own && !isLink
      ? `<a href="${escapeHTML(own)}" target="_blank" rel="noopener nofollow">${name}</a>`
      : name;
    const by = e.detail ? `<span class="al-by">${escapeHTML(e.detail)}</span>` : '';
    // found ("yes" in the sheet) switches the wording for things I came across myself.
    const via = e.found ? 'Found through' : 'Recommended by';
    const from = name ? `<span class="al-from">${via} <strong>${nameHTML}</strong></span>` : '';
    const sub = by || from ? `<div class="al-line al-line--sub">${by}${by && from ? '<span class="al-dot" aria-hidden="true">·</span>' : ''}${from}</div>` : '';
    return `<li class="al-item">
      <div class="al-body">
        <div class="al-line"><span class="al-type" title="${escapeHTML(kind)}" role="img" aria-label="${escapeHTML(kind)}">${(window.AL_KIND_ICONS || {})[kind] || ''}</span>${title}</div>
        ${sub}
      </div>
      <span class="al-state al-state--${st}" data-tip="${STATUS_LABEL[st]}" tabindex="0" role="img" aria-label="${STATUS_LABEL[st]}">${(window.AL_ICONS || {})[st] || ''}</span>
    </li>`;
  }

  function say(text) {
    msg.textContent = text;
    msg.hidden = !text;
  }

  function syncEmpty(text) {
    if (text) empty.textContent = text;
    empty.hidden = items.children.length > 0;
  }

  // Everything on the page comes from the sheet, newest first.
  function loadLive() {
    if (!live) { syncEmpty(); return; }
    fetch(ANTILIBRARY_ENDPOINT)
      .then(res => res.json())
      .then(entries => {
        items.innerHTML = entries.filter(e => e.title).map(itemHTML).join('');
        syncEmpty();
      })
      .catch(() => syncEmpty('Couldn’t load the list right now. Try again in a bit.'));
  }

  const fields = document.getElementById('alFields');
  function syncFields() {
    const kind = form.kind.value;
    const cfg = KINDS[kind];
    const isLink = !cfg;
    fields.hidden = isLink;
    form.f1.required = !isLink;
    form.link.required = isLink;
    document.getElementById('alLinkLabel').textContent = isLink ? 'Link' : 'Your link (optional)';
    if (cfg) {
      document.getElementById('alF1Label').textContent = cfg.f1;
      document.getElementById('alF2Label').textContent = cfg.f2;
    } else {
      form.f1.value = '';
      form.f2.value = '';
    }
  }
  form.kind.addEventListener('change', () => { syncFields(); say(''); });
  syncFields();

  form.addEventListener('submit', e => {
    e.preventDefault();
    say('');

    // Honeypot — a real visitor never sees or fills this field.
    if (form.company.value) return;

    const kind = form.kind.value;
    const isLink = !KINDS[kind];
    const entry = { kind, recommendedBy: form.recommendedBy.value.trim(), link: '' };

    const rawLink = form.link.value.trim();
    let url = null;
    if (rawLink) {
      try { url = new URL(rawLink); } catch (_) { /* handled below */ }
      if (!url || !/^https?:$/.test(url.protocol)) {
        say('That doesn’t look like a link. Paste the full address, starting with https://');
        return;
      }
      entry.link = url.href;
    }

    if (isLink) {
      if (!url) return;
      entry.title = url.hostname.replace(/^www\./, '');
      entry.detail = '';
    } else {
      entry.title = form.f1.value.trim();
      entry.detail = form.f2.value.trim();
      if (!entry.title) return;
    }

    if (!live) { say('Adding isn’t switched on yet. Try again soon.'); return; }

    const btn = form.querySelector('.recommend-submit');
    btn.disabled = true;

    fetch(ANTILIBRARY_ENDPOINT, { method: 'POST', body: JSON.stringify(entry) })
      .then(res => {
        if (!res.ok) throw new Error('bad response');
        // Show it straight away rather than waiting on a refetch.
        items.insertAdjacentHTML('afterbegin', itemHTML({ ...entry, status: 'suggested' }));
        syncEmpty();
        form.f1.value = '';
        form.f2.value = '';
        form.link.value = '';
        say('Added. Thank you!');
      })
      .catch(() => say('Something went wrong. Try again in a bit.'))
      .finally(() => { btn.disabled = false; });
  });

  loadLive();
});
