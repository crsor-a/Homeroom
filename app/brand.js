// Brand marks live here and only here, so the placeholder comet can be swapped later.
// The comet: a round head with a tapered three-stroke tail, drawn on a 32x32 grid.

const COMET_BODY = `
  <circle cx="22" cy="10" r="5"/>
  <path d="M20.1 14.1 17.9 11.9 5 27z"/>
  <path d="M17.2 11.2 15.8 9.8 8.5 18.5z"/>
  <path d="M22.2 16.2 20.8 14.8 13.5 23.5z"/>`;

/** Inline comet SVG. Uses currentColor so it follows the surrounding text color. */
export function cometSVG({ size = 24, label = '' } = {}) {
  const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"';
  return `<svg class="comet" width="${size}" height="${size}" viewBox="0 0 32 32"
    fill="currentColor" ${a11y} focusable="false">${COMET_BODY}</svg>`;
}

/** White-on-transparent comet as a data URL, used for the favicon. */
export function faviconHref() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="#ffffff">${COMET_BODY}</svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

/** Point the page's favicon at the comet. */
export function applyFavicon() {
  let link = document.querySelector('link[rel="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.append(link);
  }
  link.type = 'image/svg+xml';
  link.href = faviconHref();
}
