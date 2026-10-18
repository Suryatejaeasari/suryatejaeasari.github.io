(() => {
  'use strict';
  const API = 'https://api.base.easari.com';
  const page = document.querySelector('.base-locked-page');
  if (!page) return;
  const slug = page.dataset.slug || '';
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return;
  const endpoint = `${API}/vault/${encodeURIComponent(slug)}`;
  const status = document.getElementById('base-access-status');
  const form = document.getElementById('base-unlock-form');
  const code = document.getElementById('base-access-code');
  let content = document.getElementById('base-protected-content');
  // Recover from older layouts that used a preformatted container.
  if (content && content.tagName !== 'DIV') {
    const replacement = document.createElement('div');
    replacement.id = 'base-protected-content';
    replacement.className = 'post-content';
    replacement.hidden = content.hidden;
    content.replaceWith(replacement);
    content = replacement;
  }
  content.classList.add('post-content');
  console.info('BASE vault reader cutover loaded', slug);
  const button = form.querySelector('button');
  const gate = document.getElementById('base-vault-gate');
  const article = document.getElementById('base-unlocked-article');

  // HTML is pre-rendered and sanitized in the private publisher. Apply a second
  // restrictive allowlist in the browser before inserting it into the article.
  function safeHtml(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const allowed = new Set('A ABBR B BLOCKQUOTE BR CODE DEL DIV EM FIGCAPTION FIGURE BUTTON H1 H2 H3 H4 H5 H6 HR I IMG INPUT KBD LI OL P PRE S SAMP SMALL SOURCE SPAN STRONG SUB SUP TABLE TBODY TD TH THEAD TR U UL VIDEO'.split(' '));
    const allowedAttrs = new Set(['class','id','title','alt','width','height','align','loading','controls','muted','loop','playsinline','preload','type','aria-label','aria-hidden','role','data-lang','disabled']);
    function clean(node) {
      for (const child of Array.from(node.children)) {
        if (!allowed.has(child.tagName)) { child.replaceWith(document.createTextNode(child.textContent || '')); continue; }
        for (const attr of Array.from(child.attributes)) {
          const name = attr.name.toLowerCase(), value = attr.value.trim();
          if (name === 'href' || name === 'src' || name === 'poster') {
            const safe = !value.startsWith('//') && !/[\u0000-\u001f]/.test(value) && (/^\/(?!\/)/.test(value) || /^https?:\/\//i.test(value));
            if (!safe) child.removeAttribute(attr.name);
          } else if (!allowedAttrs.has(name) ||
            (name === 'class' && !/^[a-zA-Z0-9_ :.+-]*$/.test(value)) ||
            (name === 'id' && !/^[A-Za-z][A-Za-z0-9_\-:.]*$/.test(value)) ||
            (name === 'data-lang' && !(child.matches('div,span') && /^[A-Za-z0-9_+.#-]{1,40}$/.test(value))) ||
            (name === 'type' && !((child.tagName === 'BUTTON' && value === 'button') || (child.tagName === 'SOURCE' && ['video/mp4','video/webm','image/webp','image/png','image/jpeg'].includes(value)))) ||
            (name === 'disabled' && child.tagName !== 'BUTTON')) child.removeAttribute(attr.name);
        }
        if (child.tagName === 'A') child.rel = 'noopener noreferrer';
        if (child.tagName === 'INPUT') child.disabled = true;
        // Only native Chirpy code-header buttons are allowed in the article.
        if (child.tagName === 'BUTTON' && !child.closest('.code-header')) { child.replaceWith(document.createTextNode(child.textContent || '')); continue; }
        if (child.tagName === 'BUTTON') child.type = 'button';
        clean(child);
      }
    }
    clean(doc.body);
    const fragment = document.createDocumentFragment();
    while (doc.body.firstChild) fragment.append(doc.body.firstChild);
    return fragment;
  }
  // Preserve Chirpy's native header/button. Do not add a second toolbar or icon.
  function enhanceCodeBlocks() {
    for (const header of content.querySelectorAll('.code-header')) {
      const buttons = [...header.querySelectorAll('button')];
      if (buttons.length !== 1) {
        // Fail visibly rather than synthesizing a second control on malformed output.
        console.warn('BASE Vault: unexpected Chirpy clipboard structure');
        continue;
      }
      const button = buttons[0];
      button.type = 'button';
      button.classList.add('base-native-copy');
      button.setAttribute('aria-label', 'Copy code');
      button.title = 'Copy code';
    }
  }

  // Delegated handler for the original, preserved Chirpy button after unlock.
  content.addEventListener('click', async event => {
    const button = event.target.closest('.code-header button.base-native-copy');
    if (!button || !content.contains(button)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const outer = button.closest('.code-header')?.parentElement;
    const source = outer?.querySelector('.rouge-code pre, .highlight pre, pre code');
    if (!source) return;
    const text = (source.textContent || '').replace(/\n$/, '');
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      button.setAttribute('aria-label', 'Copied');
      button.title = 'Copied';
    } catch {
      button.setAttribute('aria-label', 'Copy unavailable');
      button.title = 'Copy unavailable (check clipboard permission)';
    }
  }, true);

  async function fetchProtected(kind) {
    return fetch(`${endpoint}/${kind}?attempt=${crypto.randomUUID()}`, {
      credentials:'include', cache:'no-store', headers:{Accept:kind==='html'?'text/html':'text/plain'}
    });
  }
  async function readContent(afterUnlock = false) {
    let response = await fetchProtected('html');
    if (afterUnlock && response.status === 403) response = await fetchProtected('html');
    if (response.ok) {
      const rendered = safeHtml(await response.text());
      const first = rendered.firstElementChild;
      if (first?.tagName === 'H1' && first.textContent.trim() === document.querySelector('article header h1')?.textContent.trim()) first.remove();
      content.replaceChildren(rendered);
      enhanceCodeBlocks();
      content.hidden = false;
      gate.hidden = true; article.hidden = false;
      status.classList.remove('base-error'); status.textContent = '';
      return true;
    }
    if (response.status === 401) {
      await fetch(`${API}/session`, {method:'POST', credentials:'include',cache:'no-store'});
      return false;
    }
    if (response.status === 403 && !afterUnlock) return false;
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Unable to load protected HTML (${response.status})`);
  }
  async function start() {
    try {
      if (await readContent()) return;
      status.textContent = 'This writeup is sealed. Enter your personal access code.';
      form.hidden = false;
    } catch (err) { status.textContent = err.message; status.classList.add('base-error'); }
  }
  form.addEventListener('submit', async event => {
    event.preventDefault(); const secret = code.value.trim(); if (!secret) return;
    button.disabled = true; status.classList.remove('base-error'); status.textContent = 'Validating access…';
    try {
      const response = await fetch(`${endpoint}/unlock`, {
        method:'POST', credentials:'include', cache:'no-store',
        headers:{'Content-Type':'application/json'}, body:JSON.stringify({code:secret})
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || `Unable to unlock (${response.status})`);
      code.value = ''; await readContent(true);
    } catch (err) { status.textContent = err.message || 'Request failed'; status.classList.add('base-error'); }
    finally { button.disabled = false; }
  });
  start();
})();
