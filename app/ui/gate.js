// Device gate: phones, tablets and narrow windows get a single message instead of the app.

import { cometSVG } from '../brand.js';

const MIN_WIDTH = 900;

/** True when the viewport is too narrow, or the only pointer is a finger. */
export function shouldGate() {
  const narrow = window.innerWidth < MIN_WIDTH;
  const touchOnly = matchMedia('(pointer: coarse)').matches && !matchMedia('(any-pointer: fine)').matches;
  return narrow || touchOnly;
}

export function renderGate(el) {
  el.innerHTML = `${cometSVG({ size: 56, label: 'Homeroom' })}
    <p>Homeroom is built for desktop computers and laptops, but we're working on it.</p>`;
}
