// Library view (filled in by Phase 2).
import { h } from '../dom.js';
import { genreLabel } from '../catalog.js';

export function mountLibrary(view, { query = {} } = {}) {
  const title = h('h2', { class: 'lib-stub' });
  const update = (q) => { title.textContent = q.genre ? `Library: ${genreLabel(q.genre)}` : 'Library'; };
  update(query);
  view.append(title);
  return { update, destroy() {} };
}
