// Avatars are stored as data ({ bg, symbol }) and rendered as SVG on demand.

import { COMET_BODY } from '../brand.js';
import { esc } from '../dom.js';

// 12 basic colors. `fg` is the symbol color that stays readable on that background.
export const AVATAR_COLORS = {
  red: { bg: '#ff453a', fg: '#ffffff', label: 'Red' },
  orange: { bg: '#ff9f0a', fg: '#1c1c1e', label: 'Orange' },
  yellow: { bg: '#ffd60a', fg: '#1c1c1e', label: 'Yellow' },
  green: { bg: '#30d158', fg: '#1c1c1e', label: 'Green' },
  mint: { bg: '#66d4cf', fg: '#1c1c1e', label: 'Mint' },
  teal: { bg: '#40c8e0', fg: '#1c1c1e', label: 'Teal' },
  blue: { bg: '#0a84ff', fg: '#ffffff', label: 'Blue' },
  indigo: { bg: '#5e5ce6', fg: '#ffffff', label: 'Indigo' },
  purple: { bg: '#bf5af2', fg: '#ffffff', label: 'Purple' },
  pink: { bg: '#ff375f', fg: '#ffffff', label: 'Pink' },
  brown: { bg: '#ac8e68', fg: '#1c1c1e', label: 'Brown' },
  graphite: { bg: '#636366', fg: '#ffffff', label: 'Graphite' },
};

const F = 'fill="currentColor" stroke="none"';

// About 24 symbols on a 24x24 grid. Strokes and fills both use currentColor.
export const AVATAR_SYMBOLS = {
  comet: { label: 'Comet', svg: `<g transform="translate(1.5 1.5) scale(.66)" ${F}>${COMET_BODY}</g>` },
  star: { label: 'Star', svg: `<path ${F} d="M12 4l2.4 5 5.5.6-4 3.8 1 5.4L12 16.2l-4.9 2.6 1-5.4-4-3.8 5.5-.6z"/>` },
  moon: { label: 'Moon', svg: `<path ${F} d="M18 14.5A7 7 0 1 1 9.5 6a5.5 5.5 0 0 0 8.5 8.5z"/>` },
  sun: { label: 'Sun', svg: `<circle cx="12" cy="12" r="3.5" ${F}/><path d="M12 4v2M12 18v2M4 12h2M18 12h2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M17.7 6.3l-1.4 1.4M7.7 16.3l-1.4 1.4"/>` },
  bolt: { label: 'Bolt', svg: `<path ${F} d="M13 4L6 13.5h5L10 20l7-9.5h-5z"/>` },
  leaf: { label: 'Leaf', svg: `<path ${F} d="M6 18C6 10 10 6 18 6c0 8-4 12-12 12z"/>` },
  wave: { label: 'Wave', svg: '<path d="M4 10c2.7-2.7 5.3 2.7 8 0s5.3 2.7 8 0M4 15c2.7-2.7 5.3 2.7 8 0s5.3 2.7 8 0"/>' },
  flame: { label: 'Flame', svg: `<path ${F} d="M12 20a5.5 5.5 0 0 1-5.5-5.5c0-3.5 3-5 3.5-9 2 1.5 3 3.5 2.5 5.5 1-.5 2-1.5 2.2-3 1.6 1.6 2.8 3.9 2.8 6.5A5.5 5.5 0 0 1 12 20z"/>` },
  drop: { label: 'Drop', svg: `<path ${F} d="M12 4.5s5.5 6 5.5 9.5a5.5 5.5 0 0 1-11 0C6.5 10.5 12 4.5 12 4.5z"/>` },
  cloud: { label: 'Cloud', svg: `<path ${F} d="M7.5 18a4 4 0 0 1-.4-8 5.5 5.5 0 0 1 10.6 1.5A3.3 3.3 0 0 1 17 18z"/>` },
  mountain: { label: 'Mountain', svg: `<path ${F} d="M3.5 18.5l5.5-9 3.5 5 2.5-3.5 5.5 7.5z"/>` },
  heart: { label: 'Heart', svg: `<path ${F} d="M12 19s-7-4.4-7-9.5A3.8 3.8 0 0 1 12 7a3.8 3.8 0 0 1 7 2.5C19 14.6 12 19 12 19z"/>` },
  note: { label: 'Note', svg: `<path d="M9.5 17V7l8-2v10"/><circle cx="7.5" cy="17" r="2" ${F}/><circle cx="15.5" cy="15" r="2" ${F}/>` },
  orbit: { label: 'Orbit', svg: `<circle cx="12" cy="12" r="2.5" ${F}/><ellipse cx="12" cy="12" rx="8" ry="3.5"/>` },
  circle: { label: 'Circle', svg: `<circle cx="12" cy="12" r="6" ${F}/>` },
  ring: { label: 'Ring', svg: '<circle cx="12" cy="12" r="6"/>' },
  square: { label: 'Square', svg: `<rect x="6.5" y="6.5" width="11" height="11" rx="2" ${F}/>` },
  triangle: { label: 'Triangle', svg: `<path ${F} d="M12 5.5l7 12.5H5z"/>` },
  diamond: { label: 'Diamond', svg: `<path ${F} d="M12 4.5l7 7.5-7 7.5-7-7.5z"/>` },
  hexagon: { label: 'Hexagon', svg: `<path ${F} d="M12 4.5l6.5 3.75v7.5L12 19.5l-6.5-3.75v-7.5z"/>` },
  plus: { label: 'Plus', svg: '<path d="M12 5.5v13M5.5 12h13"/>' },
  cross: { label: 'Cross', svg: '<path d="M7 7l10 10M17 7L7 17"/>' },
  dots: { label: 'Dots', svg: `<circle cx="8.5" cy="8.5" r="2" ${F}/><circle cx="15.5" cy="8.5" r="2" ${F}/><circle cx="8.5" cy="15.5" r="2" ${F}/><circle cx="15.5" cy="15.5" r="2" ${F}/>` },
  initials: { label: 'Initials', svg: null },
};

export const DEFAULT_AVATAR = { bg: 'blue', symbol: 'comet' };

export function initials(name = '') {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  return (words[0][0] + (words[1]?.[0] || '')).toUpperCase();
}

/** Render an avatar as an SVG string. Unknown values fall back to the default. */
export function avatarSVG(avatar = DEFAULT_AVATAR, { size = 28, name = '', label = '' } = {}) {
  const color = AVATAR_COLORS[avatar?.bg] || AVATAR_COLORS[DEFAULT_AVATAR.bg];
  const symbolId = AVATAR_SYMBOLS[avatar?.symbol] ? avatar.symbol : DEFAULT_AVATAR.symbol;
  const a11y = label ? `role="img" aria-label="${esc(label)}"` : 'aria-hidden="true"';
  const inner = symbolId === 'initials'
    ? `<text x="20" y="20.5" text-anchor="middle" dominant-baseline="central" fill="${color.fg}"
        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif" font-size="15" font-weight="600">${esc(initials(name))}</text>`
    : `<g transform="translate(8 8)" color="${color.fg}" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round">${AVATAR_SYMBOLS[symbolId].svg}</g>`;
  return `<svg class="avatar" width="${size}" height="${size}" viewBox="0 0 40 40" ${a11y} focusable="false">
    <circle cx="20" cy="20" r="20" fill="${color.bg}"/>${inner}</svg>`;
}
