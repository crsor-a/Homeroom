// The Game Canvas: shows exactly one view at a time (blank, library or player) based on the route.

import { h } from '../dom.js';
import { stateView } from './states.js';
import { get, subscribe } from '../state.js';
import { gameById } from '../catalog.js';
import { mountLibrary } from './library.js';
import { mountPlayer } from './player.js';

let root;
let current = null; // { type, id, api }

function swap(type, id, mount) {
  current?.api?.destroy?.();
  root.querySelector(':scope > .view')?.remove();
  const view = h('div', { class: `view view-${type}` });
  root.prepend(view);
  root.dataset.view = type;
  current = { type, id, api: mount ? mount(view) : null };
}

function catalogError() {
  return stateView({
    title: "The game list didn't load",
    text: 'Check your connection, then try again. Your pins and stats are safe.',
    actions: [{ label: 'Try again', primary: true, onClick: () => location.reload() }],
  });
}

function show(route) {
  if (!route) return;
  const failed = get('catalogError');

  if (route.name === 'library') {
    if (current?.type === 'library' && !failed) return current.api.update(route.query);
    return swap('library', null, (view) => {
      if (failed) { view.append(catalogError()); return null; }
      return mountLibrary(view, { query: route.query });
    });
  }

  if (route.name === 'play') {
    if (current?.type === 'play' && current.id === route.id) return;
    const game = gameById(route.id);
    return swap('play', route.id, (view) => {
      if (failed) { view.append(catalogError()); return null; }
      if (!game) {
        view.append(stateView({
          title: "We couldn't find that game",
          text: `There is no game called "${route.id}" in the catalog. It may have been removed.`,
          actions: [{ label: 'Open the Library', primary: true, href: '#/library' }],
        }));
        return null;
      }
      return mountPlayer(view, game);
    });
  }

  swap('home', null, null);
}

export function initCanvas(el) {
  root = el;
  subscribe('route', show);
  show(get('route'));
}
