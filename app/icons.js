// Homeroom's own icon set: monochrome line icons on a 24x24 grid, drawn with currentColor.
// The stroke width is scaled so it always renders at 1.5 CSS pixels, whatever the size.

const ICONS = {
  // Navigation and UI
  library: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
  genres: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>',
  star: '<path d="M12 3.5l2.6 5.4 5.9.7-4.3 4.1 1.1 5.9L12 16.8l-5.3 2.8 1.1-5.9-4.3-4.1 5.9-.7z"/>',
  'star-fill': '<path fill="currentColor" d="M12 3.5l2.6 5.4 5.9.7-4.3 4.1 1.1 5.9L12 16.8l-5.3 2.8 1.1-5.9-4.3-4.1 5.9-.7z"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  more: '<circle cx="6" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="18" cy="12" r="1.3" fill="currentColor" stroke="none"/>',
  'chevron-down': '<path d="M7 10l5 5 5-5"/>',
  'chevron-right': '<path d="M10 7l5 5-5 5"/>',
  'chevron-left': '<path d="M14 7l-5 5 5 5"/>',
  play: '<path d="M8 5.5v13l10.5-6.5z"/>',
  maximize: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  minimize: '<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>',
  close: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  'eye-off': '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/><path d="M4 4l16 16"/>',
  'arrow-left': '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12.5h10L18 7M9 7V4.5h6V7"/>',
  refresh: '<path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  alert: '<path d="M12 4L2.8 19.5h18.4z"/><path d="M12 10v4M12 17h.01"/>',
  user: '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>',
  link: '<path d="M14 5h5v5M19 5l-8 8M17 14v5H5V7h5"/>',

  // Genres
  racing: '<path d="M5 21V4M5 4h12l-2.5 4L17 12H5"/>',
  action: '<path d="M13 3L5 13.5h6L10 21l8-10.5h-6z"/>',
  adventure: '<circle cx="12" cy="12" r="8.5"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  sandbox: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/>',
  sports: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c3.2 2.6 3.2 14.4 0 17M12 3.5c-3.2 2.6-3.2 14.4 0 17"/>',
  puzzle: '<path d="M5 8h3a2 2 0 0 1 4 0h3v3a2 2 0 0 1 0 4v4H5z"/>',
  arcade: '<circle cx="12" cy="6.5" r="2.5"/><path d="M12 9v6M5 15h14v4.5H5z"/>',
  strategy: '<path d="M4 17l1.5-9 4.5 4 2-6 2 6 4.5-4 1.5 9z"/><path d="M4 20h16"/>',
  horror: '<path d="M6 20v-9a6 6 0 0 1 12 0v9l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5z"/><path d="M10 11h.01M14 11h.01"/>',
  rhythm: '<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
  party: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18"/>',
  idle: '<path d="M7 3.5h10M7 20.5h10M8 3.5c0 5 8 6 8 8.5s-8 3.5-8 8.5M16 3.5c0 5-8 6-8 8.5s8 3.5 8 8.5"/>',
  'card-board': '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8.5 8.5h.01M15.5 15.5h.01M12 12h.01M15.5 8.5h.01M8.5 15.5h.01"/>',
};

/**
 * Returns an inline SVG string for a named icon.
 * Pass `label` only when the icon carries meaning on its own (no visible text next to it).
 */
export function icon(name, { size = 16, label = '', className = '' } = {}) {
  const body = ICONS[name];
  if (!body) {
    console.warn(`Unknown icon: ${name}`);
    return '';
  }
  const stroke = ((1.5 * 24) / size).toFixed(3);
  const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"';
  return `<svg class="icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"
    ${a11y} focusable="false">${body}</svg>`;
}

export function hasIcon(name) {
  return name in ICONS;
}
