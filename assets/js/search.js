function buildExploreItems() {
  const container = document.getElementById('fabExploreItems');
  if (!container || typeof VIEWS_CFG === 'undefined') return;

  const currentType = (typeof window.__LISTING__ !== 'undefined') ? window.__LISTING__.type : null;

  VIEWS_CFG.forEach(v => {
    const a = document.createElement('a');
    a.className = 'fab-panel-item';
    a.href = v.id === 'all' ? '/everything' : '/' + v.id;
    a.textContent = v.label;
    if (v.id === 'all' ? !currentType : v.id === currentType) a.classList.add('active');
    container.appendChild(a);
  });
}

function fabToggleExplore() {
  const panel   = document.getElementById('fabExplorePanel');
  const overlay = document.getElementById('fabPanelOverlay');
  const btn     = document.getElementById('fabExploreBtn');
  if (!panel) return;
  const isOpen = panel.classList.contains('open');
  closeFabPanels();
  if (!isOpen) {
    if (btn) {
      const rect = btn.getBoundingClientRect();
      panel.style.top   = (rect.bottom + 4) + 'px';
      panel.style.right = (window.innerWidth - rect.right) + 'px';
      panel.style.left  = 'auto';
    }
    panel.classList.add('open');
    overlay?.classList.add('open');
  }
}

function closeFabPanels() {
  document.getElementById('fabExplorePanel')?.classList.remove('open');
  document.getElementById('fabPanelOverlay')?.classList.remove('open');
}

document.addEventListener('DOMContentLoaded', () => {
  buildExploreItems();
});
