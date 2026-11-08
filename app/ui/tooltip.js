// Tooltips for any element with a data-tip attribute.
// One shared bubble, shown on hover (after a short delay) or keyboard focus,
// and linked to the element with aria-describedby while visible.

import { h } from '../dom.js';

const DELAY = 350;
let tip;
let current = null;
let timer = 0;

function place(el) {
  const r = el.getBoundingClientRect();
  const w = tip.offsetWidth;
  const th = tip.offsetHeight;
  let top = r.bottom + 8;
  if (top + th > innerHeight - 8) top = r.top - th - 8;
  const left = Math.max(8, Math.min(r.left + r.width / 2 - w / 2, innerWidth - w - 8));
  tip.style.top = `${Math.round(top)}px`;
  tip.style.left = `${Math.round(left)}px`;
}

function show(el) {
  clearTimeout(timer);
  if (!el.isConnected) return;
  current = el;
  // Inside a modal dialog, the bubble has to join the dialog's top layer to be visible.
  const host = el.closest('dialog') || document.body;
  if (tip.parentNode !== host) host.append(tip);
  tip.textContent = el.dataset.tip;
  tip.hidden = false;
  place(el);
  el.setAttribute('aria-describedby', tip.id);
}

export function hideTooltip() {
  clearTimeout(timer);
  if (current) current.removeAttribute('aria-describedby');
  current = null;
  if (tip) tip.hidden = true;
}

export function initTooltips() {
  tip = h('div', { class: 'tooltip', role: 'tooltip', id: 'hr-tooltip', hidden: true });
  document.body.append(tip);

  document.addEventListener('mouseover', (e) => {
    const el = e.target.closest?.('[data-tip]');
    if (!el || el === current) return;
    clearTimeout(timer);
    timer = setTimeout(() => show(el), DELAY);
  });
  document.addEventListener('mouseout', (e) => {
    const el = e.target.closest?.('[data-tip]');
    if (el && !el.contains(e.relatedTarget)) hideTooltip();
  });
  document.addEventListener('focusin', (e) => {
    const el = e.target.closest?.('[data-tip]');
    if (el && e.target === el) show(el);
    else if (current) hideTooltip();
  });
  document.addEventListener('focusout', (e) => { if (e.target === current) hideTooltip(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && current) hideTooltip(); });
  document.addEventListener('scroll', hideTooltip, true);
  document.addEventListener('pointerdown', hideTooltip, true);
}
