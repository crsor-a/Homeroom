// Player view (filled in by Phase 3).
import { h } from '../dom.js';

export function mountPlayer(view, game) {
  view.append(h('h2', { class: 'lib-stub' }, game.title));
  return { destroy() {} };
}
