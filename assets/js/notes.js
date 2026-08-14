(function () {
  var popover, headEl, titleEl, openEl, textEl, hideTimer, activeLink;

  function ensurePopover() {
    if (popover) return;
    popover = document.createElement('div');
    popover.className = 'wl-preview';
    popover.setAttribute('role', 'tooltip');

    headEl = document.createElement('div');
    headEl.className = 'wl-preview-head';

    titleEl = document.createElement('div');
    titleEl.className = 'wl-preview-title';
    headEl.appendChild(titleEl);

    openEl = document.createElement('a');
    openEl.className = 'wl-preview-open';
    openEl.setAttribute('aria-label', 'Open note');
    // Same external-link glyph used everywhere else (card-ext, bm-ext, etc.) —
    // matches the site's design language instead of a bespoke text link.
    openEl.innerHTML = '<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><polyline points="5.5,1 9,1 9,4.5"/><line x1="9" y1="1" x2="3.5" y2="6.5"/><polyline points="4,3 1,3 1,9 7,9 7,6"/></svg>';
    headEl.appendChild(openEl);

    popover.appendChild(headEl);

    textEl = document.createElement('div');
    textEl.className = 'wl-preview-text';
    popover.appendChild(textEl);

    popover.addEventListener('mouseenter', cancelHide);
    popover.addEventListener('mouseleave', scheduleHide);

    document.body.appendChild(popover);
  }

  function place(link) {
    var r = popover.getBoundingClientRect();
    var lr = link.getBoundingClientRect();
    var top = lr.bottom + 8;
    var left = lr.left;

    if (left + r.width > window.innerWidth - 16) left = window.innerWidth - r.width - 16;
    if (left < 16) left = 16;
    if (top + r.height > window.innerHeight - 16) top = lr.top - r.height - 8;
    if (top < 8) top = 8;

    popover.style.top = top + 'px';
    popover.style.left = left + 'px';
  }

  function show(link) {
    var preview = link.getAttribute('data-preview');
    if (!preview) return;
    ensurePopover();
    cancelHide();
    activeLink = link;
    titleEl.textContent = link.textContent;
    textEl.textContent = preview;
    openEl.href = link.getAttribute('href');
    popover.classList.add('is-visible');
    place(link);
  }

  function cancelHide() {
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
  }

  function scheduleHide() {
    cancelHide();
    hideTimer = setTimeout(function () {
      if (popover) popover.classList.remove('is-visible');
      activeLink = null;
    }, 150);
  }

  document.addEventListener('mouseover', function (ev) {
    var link = ev.target.closest && ev.target.closest('.wikilink[data-preview]');
    if (link) show(link);
  });

  document.addEventListener('mouseout', function (ev) {
    var link = ev.target.closest && ev.target.closest('.wikilink[data-preview]');
    if (link && link === activeLink) scheduleHide();
  });

  document.addEventListener('focusin', function (ev) {
    var link = ev.target.closest && ev.target.closest('.wikilink[data-preview]');
    if (link) show(link);
  });

  document.addEventListener('focusout', function (ev) {
    var link = ev.target.closest && ev.target.closest('.wikilink[data-preview]');
    if (link && link === activeLink) scheduleHide();
  });

  window.addEventListener('scroll', function () {
    if (activeLink) place(activeLink);
  }, true);
})();
