(() => {
  'use strict';
  const API = 'https://api.base.easari.com';
  const page = document.querySelector('.base-locked-page');
  if (!page || page.dataset.resourceId !== 'WR-001') return;
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
  console.info('BASE locked reader v4 loaded');
  const button = form.querySelector('button');

  // Safe, dependency-free Markdown subset. Raw HTML is rendered literally.
  function inline(text, parent) {
    const pattern = /(`[^`\n]+`|\*\*[^*\n]+\*\*|\*[^*\n]+\*|\[[^\]\n]+\]\(https?:\/\/[^\s)]+\))/g;
    let index = 0;
    for (const m of text.matchAll(pattern)) {
      parent.append(document.createTextNode(text.slice(index, m.index)));
      const token = m[0];
      let node;
      if (token.startsWith('`')) { node = document.createElement('code'); node.textContent = token.slice(1, -1); }
      else if (token.startsWith('**')) { node = document.createElement('strong'); node.textContent = token.slice(2, -2); }
      else if (token.startsWith('*')) { node = document.createElement('em'); node.textContent = token.slice(1, -1); }
      else {
        const match = /^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/.exec(token);
        node = document.createElement('a'); node.textContent = match[1]; node.href = match[2]; node.rel = 'noopener noreferrer';
      }
      parent.append(node); index = m.index + token.length;
    }
    parent.append(document.createTextNode(text.slice(index)));
  }
  function renderMarkdown(markdown) {
    const root = document.createDocumentFragment();
    const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
    const isBreak = line => !line.trim() || /^\s*(?:#{1,6}\s|```|>\s?|[-*+]\s|\d+\.\s|\|)/.test(line) || /^\s*---+\s*$/.test(line);
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (!line.trim()) { i++; continue; }
      const fence = /^\s*```([^`]*)$/.exec(line);
      if (fence) {
        const lang = fence[1].trim().split(/\s+/)[0].replace(/[^a-z0-9_+-]/gi, '');
        const parts = []; i++;
        while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) parts.push(lines[i++]);
        if (i < lines.length) i++;
        const pre = document.createElement('pre'); const c = document.createElement('code');
        if (lang) c.className = 'language-' + lang;
        c.textContent = parts.join('\n'); pre.append(c); root.append(pre); continue;
      }
      const h = /^\s*(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
      if (h) { const el = document.createElement('h' + h[1].length); inline(h[2], el); root.append(el); i++; continue; }
      if (/^\s*---+\s*$/.test(line)) { root.append(document.createElement('hr')); i++; continue; }
      if (/^\s*>\s?/.test(line)) {
        const q = document.createElement('blockquote'); const p = document.createElement('p');
        const chunks = []; while (i < lines.length && /^\s*>\s?/.test(lines[i])) chunks.push(lines[i++].replace(/^\s*>\s?/, ''));
        inline(chunks.join(' '), p); q.append(p); root.append(q); continue;
      }
      if (/^\s*\|/.test(line) && i + 1 < lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[i+1])) {
        const split = s => s.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(v => v.trim());
        const headers = split(line); i += 2;
        const wrap = document.createElement('div'); wrap.className = 'base-table-wrap';
        const table = document.createElement('table'); const thead = document.createElement('thead'); const tr = document.createElement('tr');
        for (const val of headers) { const cell = document.createElement('th'); inline(val, cell); tr.append(cell); }
        thead.append(tr); table.append(thead); const tbody = document.createElement('tbody');
        while (i < lines.length && /^\s*\|/.test(lines[i])) { const row = document.createElement('tr'); for (const val of split(lines[i++])) { const cell = document.createElement('td'); inline(val, cell); row.append(cell); } tbody.append(row); }
        table.append(tbody); wrap.append(table); root.append(wrap); continue;
      }
      const list = /^\s*([-*+]|\d+\.)\s+(.+)$/.exec(line);
      if (list) {
        const numbered = /\d+\./.test(list[1]); const el = document.createElement(numbered ? 'ol' : 'ul');
        while (i < lines.length) {
          const m = /^\s*([-*+]|\d+\.)\s+(.+)$/.exec(lines[i]);
          if (!m || /\d+\./.test(m[1]) !== numbered) break;
          const li = document.createElement('li'); inline(m[2], li); el.append(li); i++;
        }
        root.append(el); continue;
      }
      const chunks = [line.trim()]; i++;
      while (i < lines.length && !isBreak(lines[i])) chunks.push(lines[i++].trim());
      const p = document.createElement('p'); inline(chunks.join(' '), p); root.append(p);
    }
    return root;
  }
  async function fetchContent() {
    return fetch(`${API}/resources/WR-001/content?attempt=${crypto.randomUUID()}`, {
      credentials:'include', cache:'no-store', headers:{Accept:'text/plain'}
    });
  }
  async function readContent(afterUnlock = false) {
    let response = await fetchContent();
    if (afterUnlock && response.status === 403) response = await fetchContent();
    if (response.ok) {
      content.replaceChildren(renderMarkdown(await response.text()));
      content.hidden = false; form.hidden = true;
      status.classList.remove('base-error'); status.textContent = 'Access granted — WR-001';
      return true;
    }
    if (response.status === 401) {
      await fetch(`${API}/session`, {method:'POST', credentials:'include',cache:'no-store'});
      return false;
    }
    if (response.status === 403 && !afterUnlock) return false;
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Unable to load protected content (${response.status})`);
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
      const response = await fetch(`${API}/resources/WR-001/unlock`, {
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
