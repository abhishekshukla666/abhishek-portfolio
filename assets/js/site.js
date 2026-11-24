// Theme switch (Light → Dark → Warm) and copy buttons on code blocks.

const order = ['light', 'dark', 'warm'];
const names = { light: 'Light', dark: 'Dark', warm: 'Warm' };
const root = document.documentElement;

function stored() {
  try { return localStorage.getItem('theme'); } catch (e) { return null; }
}

function label(button) {
  const now = root.getAttribute('data-theme') || 'light';
  const next = order[(order.indexOf(now) + 1) % order.length];
  button.setAttribute('aria-label', `Theme: ${names[now]}. Switch to ${names[next]}`);
  button.title = `Theme: ${names[now]}`;
}

document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
  label(button);
  button.addEventListener('click', () => {
    const now = root.getAttribute('data-theme') || 'light';
    const next = order[(order.indexOf(now) + 1) % order.length];
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) { /* private mode: the choice lasts this page only */ }
    label(button);
  });
});

// Follow the system's light/dark setting until the reader picks a theme themselves.
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
  if (stored()) return;
  root.setAttribute('data-theme', event.matches ? 'dark' : 'light');
  document.querySelectorAll('[data-theme-toggle]').forEach(label);
});

document.querySelectorAll('[data-copy]').forEach((button) => {
  button.addEventListener('click', async () => {
    const code = button.closest('.code')?.querySelector('pre code, pre');
    if (!code) return;
    const text = button.querySelector('span');
    try {
      await navigator.clipboard.writeText(code.innerText);
      text.textContent = 'Copied';
    } catch (e) {
      text.textContent = 'Press ⌘C';
    }
    setTimeout(() => { text.textContent = 'Copy'; }, 1600);
  });
});

// Close the phone menu after choosing a link.
document.querySelectorAll('.menu-panel a').forEach((a) => {
  a.addEventListener('click', () => a.closest('details')?.removeAttribute('open'));
});

// Contact: the mailto: link opens the visitor's mail app as usual (whichever app their system
// uses for email links). As a backup for anyone without one set up, the address is also copied
// and shown in a notice.
const toast = document.querySelector('.toast');
let toastTimer;

function showToast(email, copied) {
  if (!toast) return;
  toast.replaceChildren();
  const text = document.createElement('span');
  text.textContent = copied ? 'Email copied: ' : 'Email: ';
  const link = document.createElement('a');
  link.href = `mailto:${email}`;
  link.textContent = email;
  toast.append(text, link);
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 6000);
}

document.querySelectorAll('[data-email]').forEach((el) => {
  el.addEventListener('click', async () => {
    const email = el.dataset.email;
    let copied = false;
    try { await navigator.clipboard.writeText(email); copied = true; } catch (e) { /* show it to copy by hand */ }
    showToast(email, copied);
  });
});

// Search: press "/" anywhere to open it; on /search/ the index loads once and filters as you type.
document.addEventListener('keydown', (event) => {
  if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
  const tag = document.activeElement?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;
  const box = document.querySelector('[data-search-index]');
  event.preventDefault();
  if (box) box.focus();
  else window.location.href = document.querySelector('a[aria-label^="Search"]')?.href || '/search/';
});

const searchBox = document.querySelector('[data-search-index]');
if (searchBox) {
  const results = document.querySelector('.search-results');
  const status = document.querySelector('.search-status');
  let index = null;

  // Append text to a node, wrapping each query term in <mark>, without ever parsing HTML.
  const highlight = (node, text, terms) => {
    const pattern = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    text.split(pattern).forEach((part, i) => {
      if (i % 2) { const m = document.createElement('mark'); m.textContent = part; node.append(m); }
      else node.append(part);
    });
  };

  const snippet = (item, terms) => {
    const note = item.notes.find((n) => terms.every((t) => n.toLowerCase().includes(t)))
      || item.notes.find((n) => terms.some((t) => n.toLowerCase().includes(t)));
    if (note) return note.replace(/`/g, '');
    const lower = item.text.toLowerCase();
    const at = Math.max(0, lower.indexOf(terms[0]) - 80);
    return (at > 0 ? '…' : '') + item.text.slice(at, at + 220).trim() + '…';
  };

  const run = () => {
    const terms = searchBox.value.toLowerCase().split(/\s+/).filter(Boolean);
    results.replaceChildren();
    if (!terms.length || !index) { status.textContent = index ? `${index.length} articles and notes` : 'Loading…'; return; }
    const scored = index.map((item) => {
      const title = item.title.toLowerCase(), notes = item.notes.join(' ').toLowerCase(), text = item.text.toLowerCase();
      const all = `${title} ${item.topic.toLowerCase()} ${notes} ${text}`;
      if (!terms.every((t) => all.includes(t))) return null;
      const score = terms.reduce((s, t) => s + (title.includes(t) ? 5 : 0) + (notes.includes(t) ? 3 : 0) + (text.includes(t) ? 1 : 0), 0);
      return { item, score };
    }).filter(Boolean).sort((a, b) => b.score - a.score).slice(0, 30);

    status.textContent = scored.length ? `${scored.length} result${scored.length === 1 ? '' : 's'}` : 'No results. Try fewer or different words.';
    for (const { item } of scored) {
      const li = document.createElement('li');
      const a = document.createElement('a'); a.href = item.url; a.className = 'ttl'; highlight(a, item.title, terms);
      const topic = document.createElement('span'); topic.className = 't-label'; topic.textContent = item.topic;
      const p = document.createElement('p'); p.className = 't-small'; highlight(p, snippet(item, terms), terms);
      li.append(topic, a, p);
      results.append(li);
    }
  };

  fetch(searchBox.dataset.searchIndex).then((r) => r.json()).then((data) => {
    index = data;
    const q = new URLSearchParams(location.search).get('q');
    if (q) searchBox.value = q;
    run();
  }).catch(() => { status.textContent = 'Search could not load. Please refresh the page.'; });

  searchBox.addEventListener('input', () => {
    run();
    const url = new URL(location.href);
    if (searchBox.value) url.searchParams.set('q', searchBox.value); else url.searchParams.delete('q');
    history.replaceState(null, '', url);
  });
}
