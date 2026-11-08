// Tiny DOM helpers shared by every UI module.

/** Escape text for safe interpolation into HTML strings. */
export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Build one element from an HTML string. */
export function fromHTML(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

/**
 * Create an element: h('button', { class: 'btn', onclick: fn }, 'Label', childNode).
 * Attributes starting with "on" become listeners; `html` sets innerHTML.
 */
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value == null || value === false) continue;
    if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2), value);
    } else if (key === 'html') {
      el.innerHTML = value;
    } else if (key === 'class') {
      el.className = value;
    } else if (value === true) {
      el.setAttribute(key, '');
    } else {
      el.setAttribute(key, value);
    }
  }
  for (const child of children.flat()) {
    if (child == null || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return el;
}

/** Elements that can take keyboard focus, in DOM order. */
export function focusables(root) {
  const sel = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return [...root.querySelectorAll(sel)].filter((el) => !el.closest('[hidden], [inert]') && el.getClientRects().length);
}

let idCounter = 0;
/** A unique id for aria wiring. */
export function uid(prefix = 'hr') {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

/** Human-friendly playtime: "0m", "12m", "3h 05m". */
export function formatPlaytime(ms = 0) {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${String(minutes % 60).padStart(2, '0')}m`;
}

/** "Nov 8, 2026" */
export function formatDate(ts) {
  if (!ts) return 'Never';
  return new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/** True when the user asked the OS for less motion. */
export function reducedMotion() {
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}
