(() => {
  'use strict';
  const API = 'https://api.base.easari.com';
  const page = document.querySelector('.base-locked-page');
  if (!page || page.dataset.resourceId !== 'WR-001') return;
  const status = document.getElementById('base-access-status');
  const form = document.getElementById('base-unlock-form');
  const code = document.getElementById('base-access-code');
  const content = document.getElementById('base-protected-content');
  const button = form.querySelector('button');
  async function readContent() {
    const response = await fetch(`${API}/resources/WR-001/content`, {credentials:'include', cache:'no-store'});
    if (response.ok) {
      const body = await response.text();
      // Safe initial rendering: never insert untrusted Markdown as raw HTML.
      const pre = document.createElement('pre');
      pre.textContent = body;
      content.replaceChildren(pre);
      content.hidden = false;
      form.hidden = true;
      status.textContent = 'Access granted — WR-001';
      return true;
    }
    if (response.status === 401) {
      await fetch(`${API}/session`, {method:'POST', credentials:'include', cache:'no-store'});
      return false;
    }
    if (response.status === 403) return false;
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Resource unavailable (${response.status})`);
  }
  async function start() {
    try {
      const unlocked = await readContent();
      if (unlocked) return;
      status.textContent = 'This writeup is sealed. Enter your personal access code.';
      form.hidden = false;
    } catch (e) {status.textContent = e.message; status.classList.add('base-error');}
  }
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const secret = code.value.trim();
    if (!secret) return;
    button.disabled = true;
    status.classList.remove('base-error');
    status.textContent = 'Validating access…';
    try {
      const response = await fetch(`${API}/resources/WR-001/unlock`, {
        method:'POST', credentials:'include', cache:'no-store',
        headers:{'Content-Type':'application/json'}, body:JSON.stringify({code:secret})
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || `Unable to unlock (${response.status})`);
      code.value = '';
      if (!await readContent()) throw new Error('Access granted but content could not be loaded.');
    } catch (err) {status.textContent = err.message;status.classList.add('base-error');}
    finally {button.disabled = false;}
  });
  start();
})();
