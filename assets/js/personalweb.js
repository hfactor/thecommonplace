'use strict';

// Personal Websites page: a random-site button, and a submit form that adds to
// the Antilibrary sheet exactly like any link added there (kind "Link").
document.addEventListener('DOMContentLoaded', () => {
  const form   = document.getElementById('pwForm');
  const toggle = document.getElementById('pwSubmitToggle');
  const random = document.getElementById('pwRandom');
  const items  = document.getElementById('pwItems');
  const msg    = document.getElementById('pwMsg');
  if (!form || !toggle || !random || !items) return;

  const live = ANTILIBRARY_DEPLOYMENT !== 'REPLACE_WITH_YOUR_APPS_SCRIPT_URL';
  const endpoint = ANTILIBRARY_DEPLOYMENT.startsWith('http')
    ? ANTILIBRARY_DEPLOYMENT
    : `https://script.google.com/macros/s/${ANTILIBRARY_DEPLOYMENT}/exec`;

  const say = text => { msg.textContent = text; msg.hidden = !text; };

  // Filter: All / Portfolio / Blog / Digital Garden, in the site's own dropdown
  // (.pt-nav, the same one the bar uses). A site matches if its tags include the choice.
  const rows   = Array.from(items.querySelectorAll('.pw-item'));
  const nav    = document.getElementById('pwNav');
  const navBtn = document.getElementById('pwFilterBtn');
  const menu   = document.getElementById('pwFilterMenu');
  const label  = document.getElementById('pwFilterLabel');
  const setMenu = open => {
    nav.classList.toggle('pt-nav--open', open);
    navBtn.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-hidden', String(!open));
  };
  navBtn.addEventListener('click', e => { e.stopPropagation(); setMenu(!nav.classList.contains('pt-nav--open')); });
  document.addEventListener('click', e => { if (!nav.contains(e.target)) setMenu(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  menu.querySelectorAll('.pt-nav-link').forEach(link => link.addEventListener('click', e => {
    e.preventDefault();
    const tag = link.dataset.tag;
    menu.querySelectorAll('.pt-nav-link').forEach(l => l.classList.toggle('pt-nav-link--active', l === link));
    label.textContent = link.dataset.label;
    rows.forEach(r => { r.hidden = !!tag && !(r.dataset.tags || '').split('|').includes(tag); });
    setMenu(false);
  }));

  // Random: any site that is showing right now (so it follows the filter), in a new tab.
  random.addEventListener('click', () => {
    const shown = rows.filter(r => !r.hidden).map(r => r.querySelector('a.al-title')).filter(Boolean);
    if (!shown.length) return;
    const pick = shown[Math.floor(Math.random() * shown.length)];
    window.open(pick.href, '_blank', 'noopener');
  });

  toggle.addEventListener('click', () => {
    const open = form.hidden;
    form.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    if (open) form.link.focus();
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    say('');
    if (form.company.value) return; // honeypot

    let url = null;
    try { url = new URL(form.link.value.trim()); } catch (_) { /* handled below */ }
    if (!url || !/^https?:$/.test(url.protocol)) {
      say('That doesn’t look like a link. Paste the full address, starting with https://');
      return;
    }
    // Same shape the Antilibrary form sends for a Link: the title is the host.
    const entry = {
      kind: 'Link',
      title: url.hostname.replace(/^www\./, ''),
      detail: '',
      recommendedBy: form.recommendedBy.value.trim(),
      link: url.href,
    };
    if (!live) { say('Submitting isn’t switched on yet. Try again soon.'); return; }

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    fetch(endpoint, { method: 'POST', body: JSON.stringify(entry) })
      .then(res => {
        if (!res.ok) throw new Error('bad response');
        form.link.value = '';
        say('Thank you! I’ll take a look.');
      })
      .catch(() => say('Something went wrong. Try again in a bit.'))
      .finally(() => { btn.disabled = false; });
  });
});
