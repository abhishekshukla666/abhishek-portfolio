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
