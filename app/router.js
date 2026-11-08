// Hash routes, so GitHub Pages never has to serve anything but index.html.
//   #/                       blank canvas
//   #/library?genre=racing   library (query holds the filters)
//   #/play/<gameId>          player

import { set } from './state.js';

let lastNonPlay = '#/';

/** Parse a hash like "#/library?genre=racing" into { name, id, query, hash }. */
export function parse(hash) {
  const raw = (hash || '').replace(/^#/, '') || '/';
  const [path, qs = ''] = raw.split('?');
  const parts = path.split('/').filter(Boolean);
  const query = Object.fromEntries(new URLSearchParams(qs));
  const route = { name: 'home', id: null, query, hash: '#' + raw };
  if (parts[0] === 'library') route.name = 'library';
  else if (parts[0] === 'play' && parts[1]) {
    route.name = 'play';
    route.id = decodeURIComponent(parts[1]);
  }
  return route;
}

function publish() {
  const route = parse(location.hash);
  if (route.name !== 'play') lastNonPlay = route.hash;
  set('route', route);
}

export function start() {
  window.addEventListener('hashchange', publish);
  publish();
}

/** Navigate (adds a history entry). */
export function go(hash) {
  if (location.hash === hash || (!location.hash && hash === '#/')) publish();
  else location.hash = hash;
}

/** Change the URL without a history entry (used while typing filters), then republish. */
export function replace(hash) {
  if (location.hash === hash) return;
  history.replaceState(null, '', hash);
  publish();
}

/** Where the player's Close button goes: the last library view, or the blank canvas. */
export function lastNonPlayHash() {
  return lastNonPlay;
}

export function libraryHash(query = {}) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) if (v) qs.set(k, v);
  const s = qs.toString();
  return '#/library' + (s ? '?' + s : '');
}

export const playHash = (id) => '#/play/' + encodeURIComponent(id);
