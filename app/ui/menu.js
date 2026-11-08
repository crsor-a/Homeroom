// Anchored popovers and menus. One popover is open at a time.
// Esc or a click outside closes it; focus goes back to the button that opened it.

import { h, focusables, reducedMotion } from '../dom.js';
import { icon } from '../icons.js';

let active = null;

export function closePopover() { active?.close(false); }

/** Place `pop` next to `anchor`, flipping vertically and clamping to the viewport. */
function position(pop, anchor, placement) {
  const r = anchor.getBoundingClientRect();
  const w = pop.offsetWidth;
  const ph = pop.offsetHeight;
  const gap = 6;
  const m = 8;
  let top = placement.startsWith('top') ? r.top - ph - gap : r.bottom + gap;
  if (top + ph > innerHeight - m) top = r.top - ph - gap;
  if (top < m) top = Math.min(r.bottom + gap, innerHeight - ph - m);
  let left = placement.endsWith('end') ? r.right - w : r.left;
  left = Math.max(m, Math.min(left, innerWidth - w - m));
  pop.style.top = `${Math.round(top)}px`;
  pop.style.left = `${Math.round(left)}px`;
}

/**
 * Open `content` in a popover anchored to `anchor`.
 * placement: 'bottom-end' | 'bottom-start' | 'top-start' | 'top-end'
 */
export function openPopover(anchor, content, { placement = 'bottom-end', role = 'dialog', label = '', className = '', onClose } = {}) {
  closePopover();
  // A popover opened from inside a modal dialog must live in that dialog's top layer.
  const host = anchor.closest('dialog') || document.body;
  const pop = h('div', { class: `popover ${className}`, role, 'aria-label': label || null, tabindex: '-1' });
  pop.append(content);
  host.append(pop);
  position(pop, anchor, placement);
  anchor.setAttribute('aria-expanded', 'true');

  let closed = false;
  const onPointer = (e) => { if (!pop.contains(e.target) && !anchor.contains(e.target)) close(false); };
  const onKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true); }
  };
  const onViewport = () => close(false);

  function close(restoreFocus = true) {
    if (closed) return;
    closed = true;
    document.removeEventListener('pointerdown', onPointer, true);
    window.removeEventListener('resize', onViewport);
    window.removeEventListener('blur', onViewport);
    anchor.setAttribute('aria-expanded', 'false');
    if (active?.el === pop) active = null;
    const finish = () => pop.remove();
    if (reducedMotion()) finish();
    else { pop.classList.add('is-closing'); setTimeout(finish, 140); }
    if (restoreFocus && anchor.isConnected) anchor.focus();
    onClose?.();
  }

  // Defer so the click that opened the popover does not immediately close it.
  setTimeout(() => document.addEventListener('pointerdown', onPointer, true));
  pop.addEventListener('keydown', onKey);
  window.addEventListener('resize', onViewport);
  window.addEventListener('blur', onViewport);

  active = { el: pop, close, reposition: () => position(pop, anchor, placement) };
  return active;
}

/**
 * Open a menu of actions. items: [{ label, icon, onSelect, danger }] or 'separator'.
 * Arrow keys, Home and End move between items; Tab closes the menu.
 */
export function openMenu(anchor, items, { placement = 'bottom-end', label = 'Options' } = {}) {
  const list = h('div', { class: 'menu-list' });
  let popover;
  for (const item of items) {
    if (item === 'separator') { list.append(h('div', { class: 'menu-sep', role: 'separator' })); continue; }
    list.append(h('button', {
      class: 'menu-item' + (item.danger ? ' is-danger' : ''),
      type: 'button', role: 'menuitem', tabindex: '-1',
      html: `${item.icon ? icon(item.icon) : ''}<span>${item.label}</span>`,
      onclick: () => { popover.close(true); item.onSelect?.(); },
    }));
  }
  popover = openPopover(anchor, list, { placement, role: 'menu', label, className: 'menu' });
  const menuItems = [...list.querySelectorAll('[role="menuitem"]')];
  list.addEventListener('keydown', (e) => {
    const i = menuItems.indexOf(document.activeElement);
    const to = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: menuItems.length - 1 }[e.key];
    if (to !== undefined) {
      e.preventDefault();
      menuItems[(to + menuItems.length) % menuItems.length].focus();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      popover.close(true);
    }
  });
  menuItems[0]?.focus();
  return popover;
}

/** Focus the first control inside a popover (used by non-menu popovers). */
export function focusFirst(pop) {
  (focusables(pop)[0] || pop).focus();
}
