// Centered empty and error states for the Game Canvas.

import { h } from '../dom.js';
import { icon } from '../icons.js';

/** A centered message with optional actions: [{ label, primary, href | onClick }]. */
export function stateView({ iconName = 'alert', title, text = '', actions = [] }) {
  return h('div', { class: 'state', role: 'status' },
    h('span', { html: icon(iconName, { size: 28 }) }),
    h('h2', {}, title),
    text ? h('p', {}, text) : null,
    actions.length ? h('div', { class: 'state-actions' },
      actions.map((a) => (a.href
        ? h('a', { class: 'btn' + (a.primary ? ' btn-primary' : ''), href: a.href }, a.label)
        : h('button', { class: 'btn' + (a.primary ? ' btn-primary' : ''), type: 'button', onclick: a.onClick }, a.label)))) : null);
}
