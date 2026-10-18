
(() => {
  'use strict';

  const bar = document.getElementById('home-filter');
  if (!bar) return;

  const buttons = [...bar.querySelectorAll('button[data-filter]')];
  const cards = [...document.querySelectorAll('#post-list .card-wrapper')];
  const lockedToggle = document.getElementById('base-locked-only');

  const tokens = (el, attr) =>
    (el.getAttribute(attr) || '').split(/\s+/).filter(Boolean);

  let currentFilter = 'all';

  function apply() {
    buttons.forEach(button => {
      const active = button.dataset.filter === currentFilter;

      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    const [kind, value] = currentFilter.includes(':')
      ? currentFilter.split(':')
      : ['all', ''];

    cards.forEach(card => {
      let categoryMatch = true;

      if (kind === 'cat') {
        categoryMatch = tokens(card, 'data-cats').includes(value);
      } else if (kind === 'type') {
        categoryMatch = tokens(card, 'data-type').includes(value);
      }

      const lockedMatch =
        !lockedToggle.checked ||
        card.dataset.access === 'locked';

      card.style.display =
        categoryMatch && lockedMatch ? '' : 'none';
    });

    updateHash();
  }

  function updateHash() {
    const categoryHash = {
      'cat:projects': 'projects',
      'type:publication': 'publications',
      'type:case-study': 'case-studies',
      'cat:notes': 'notes'
    }[currentFilter] || '';

    const params = new URLSearchParams();

    if (categoryHash) params.set('filter', categoryHash);
    if (lockedToggle.checked) params.set('locked', '1');

    const query = params.toString();
    const url = location.pathname +
      (query ? `?${query}` : '');

    history.replaceState(null, '', url);
  }

  function restoreFilters() {
    const params = new URLSearchParams(location.search);

    const categories = {
      projects: 'cat:projects',
      publications: 'type:publication',
      'case-studies': 'type:case-study',
      notes: 'cat:notes'
    };

    currentFilter = categories[params.get('filter')] || 'all';
    lockedToggle.checked = params.get('locked') === '1';

    apply();
  }

  bar.addEventListener('click', event => {
    const button = event.target.closest('button[data-filter]');
    if (!button) return;

    currentFilter = button.dataset.filter;
    apply();
  });

  lockedToggle.addEventListener('change', apply);

  window.addEventListener('popstate', restoreFilters);

  restoreFilters();
})();
