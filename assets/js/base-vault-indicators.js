
(() => {
  'use strict';

  const API = 'https://api.base.easari.com';
  let checkVersion = 0;

  const indicators = () =>
    [...document.querySelectorAll('.base-vault-indicator[data-vault-slug]')];

  function updateIndicator(element, unlocked) {
    const icon = element.querySelector('i');
    const label = element.querySelector('.base-vault-label');

    element.classList.toggle('is-unlocked', unlocked);

    icon.className = unlocked
      ? 'fas fa-lock-open fa-fw'
      : 'fas fa-lock fa-fw';

    label.textContent = unlocked ? 'UNLOCKED' : 'LOCKED';

    element.setAttribute(
      'aria-label',
      unlocked ? 'Article unlocked' : 'Article locked'
    );

    element.title = unlocked
      ? 'You have access to this article'
      : 'Complete the BASE challenge to unlock';
  }

  async function getJSON(path) {
    const response = await fetch(`${API}${path}`, {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store'
    });

    if (!response.ok) return null;

    return response.json();
  }

  async function refreshIndicators() {
    const elements = indicators();
    if (!elements.length) return;

    const version = ++checkVersion;

    // Default to locked until authorization is confirmed.
    elements.forEach(element => updateIndicator(element, false));

    try {
      // Root access unlocks every protected article.
      const owner = await getJSON('/owner/session');

      if (version !== checkVersion) return;

      if (owner?.authenticated && owner.role === 'root') {
        elements.forEach(element => updateIndicator(element, true));
        return;
      }

      // Otherwise, check each article's individual visitor grant.
      await Promise.all(elements.map(async element => {
        const slug = element.dataset.vaultSlug;

        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return;

        try {
          const article = await getJSON(
            `/vault/${encodeURIComponent(slug)}/status`
          );

          if (version !== checkVersion) return;

          updateIndicator(element, article?.unlocked === true);
        } catch {
          // Network failures must never imply authorization.
          if (version === checkVersion) {
            updateIndicator(element, false);
          }
        }
      }));
    } catch {
      // Keep indicators locked when the API is unavailable.
    }
  }

  // Initial page load.
  refreshIndicators();

  // Refresh when returning from BASE Terminal or another tab.
  window.addEventListener('pageshow', refreshIndicators);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshIndicators();
  });

  window.addEventListener('focus', refreshIndicators);
})();
