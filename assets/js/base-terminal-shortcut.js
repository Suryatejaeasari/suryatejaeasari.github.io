
(() => {
  'use strict';

  document.addEventListener('keydown', (event) => {
    const target = event.target;

    // Don't activate while the visitor is typing.
    if (
      target instanceof Element &&
      target.closest('input, textarea, select, [contenteditable]')
    ) {
      return;
    }

    // Ctrl + Alt + T
    if (
      event.ctrlKey &&
      event.altKey &&
      event.code === 'KeyT' &&
      !event.metaKey &&
      !event.repeat
    ) {
      event.preventDefault();

      if (window.location.pathname !== '/terminal/') {
        window.location.assign('/terminal/');
      }
    }
  });
})();
