(() => {
  'use strict';
  document.addEventListener('keydown', (event) => {
    if (event.defaultPrevented || event.repeat || event.isComposing) return;
    if (event.code !== 'KeyT' || !event.ctrlKey || !event.altKey || event.metaKey || event.shiftKey) return;
    const target = event.target;
    if (target instanceof Element && target.closest('input, textarea, select, [contenteditable], [role="textbox"]')) return;
    event.preventDefault();
    const terminal = new URL('/terminal/', window.location.origin);
    // Use the site-relative terminal route; works for base.easari.com.
    terminal.pathname = '/terminal/';
    terminal.search = '';
    terminal.hash = '';
    if (window.location.pathname !== terminal.pathname) window.location.assign(terminal.href);
  });
})();
