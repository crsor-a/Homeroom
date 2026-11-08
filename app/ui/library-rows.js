// HTML builders for the Library table. Pure functions: no state, no listeners.

import { icon } from '../icons.js';
import { esc } from '../dom.js';
import { genreLabel, tagLabel, SOURCES, gameById } from '../catalog.js';
import { playHash } from '../router.js';

const COLUMNS = [
  { key: 'title', label: 'Title', sortable: true },
  { key: 'genre', label: 'Genre', sortable: true },
  { key: 'source', label: 'Source', sortable: true },
  { key: 'play', label: 'Play' },
  { key: 'star', label: 'Pinned' },
  { key: 'more', label: 'More' },
];

/** The source label with its explanatory tooltip (dotted underline). */
export function sourceLabelHTML(source) {
  const s = SOURCES[source];
  return `<span class="source-label src-${source}" tabindex="0" data-tip="${esc(s.tip)}">${s.label}</span>`;
}

function headHTML(ui) {
  const cells = COLUMNS.map((c) => {
    if (!c.sortable) return `<th class="c-${c.key}" scope="col"><span class="sr-only">${c.label}</span></th>`;
    const active = ui.sort === c.key;
    const sort = active ? (ui.dir === 1 ? 'ascending' : 'descending') : 'none';
    return `<th class="c-${c.key}" scope="col" aria-sort="${sort}">
      <button class="th-btn${active ? ' is-active' : ''}" type="button" data-action="sort" data-sort="${c.key}">
        ${c.label}${icon('chevron-down', { size: 12, className: active && ui.dir === -1 ? 'flip' : '' })}
      </button></th>`;
  }).join('');
  return `<thead><tr>${cells}</tr></thead>`;
}

function rowHTML(g, { expanded, fresh, pinned, hidden, tabbable }) {
  const id = esc(g.id);
  const title = esc(g.title);
  const alt = g.originalAlternative && gameById(g.originalAlternative);
  const altPill = alt
    ? `<a class="pill pill-orig" href="${playHash(alt.id)}" title="Play ${esc(alt.title)}, the Homeroom Original">Original available</a>`
    : '';
  const detailId = `lib-detail-${id}`;
  const row = `
    <tr class="row${hidden ? ' is-hidden' : ''}${expanded ? ' is-expanded' : ''}" data-id="${id}" tabindex="${tabbable ? 0 : -1}">
      <td class="c-title"><div class="title-cell">
        <button class="title-btn" type="button" data-action="expand" aria-expanded="${expanded}" ${expanded ? `aria-controls="${detailId}"` : ''}>
          <span class="t">${title}</span>${icon('chevron-down', { size: 12, className: 'chev' })}
        </button>${altPill}
      </div></td>
      <td class="c-genre">${genreLabel(g.genre)}</td>
      <td class="c-source">${sourceLabelHTML(g.source)}</td>
      <td class="c-play"><a class="btn btn-play" href="${playHash(g.id)}" data-action="play" aria-label="Play ${title}">Play</a></td>
      <td class="c-star"><button class="icon-btn star${pinned ? ' is-on' : ''}" type="button" data-action="star"
        aria-pressed="${pinned}" aria-label="Star ${title}">${icon(pinned ? 'star-fill' : 'star')}</button></td>
      <td class="c-more"><button class="icon-btn" type="button" data-action="more" aria-haspopup="menu"
        aria-expanded="false" aria-label="More options for ${title}">${icon('more')}</button></td>
    </tr>`;
  if (!expanded) return row;
  const pills = g.tags.map((t) => `<button class="pill pill-tag" type="button" data-action="tag" data-tag="${t}"
    aria-label="Filter by ${esc(tagLabel(t))}">${esc(tagLabel(t))}</button>`).join('');
  return row + `
    <tr class="detail${hidden ? ' is-hidden' : ''}" id="${detailId}">
      <td colspan="6"><div class="detail-inner${fresh ? ' is-new' : ''}">
        <p>${esc(g.description)}</p>
        <div class="pills" role="group" aria-label="Tags">${pills}</div>
      </div></td>
    </tr>`;
}

/**
 * The whole table: visible games, then (optionally) the hidden ones, then the toggle link.
 * `focusId` decides which row carries tabindex=0 (roving focus).
 */
export function tableHTML({ games, hiddenGames, ui, pinnedIds, filtersActive }) {
  const ids = [...games, ...(ui.showHidden ? hiddenGames : [])].map((g) => g.id);
  const tabbableId = ids.includes(ui.focusId) ? ui.focusId : ids[0];
  const opts = (g, hidden) => ({
    expanded: ui.expanded === g.id, fresh: ui.justExpanded === g.id, pinned: pinnedIds.has(g.id), hidden, tabbable: g.id === tabbableId,
  });

  const body = games.length
    ? games.map((g) => rowHTML(g, opts(g, false))).join('')
    : `<tr class="empty"><td colspan="6"><div class="lib-empty">
        <p>${filtersActive ? 'No games match these filters.' : 'No games here yet.'}</p>
        ${filtersActive ? '<button class="btn" type="button" data-action="clear">Clear filters</button>' : ''}
      </div></td></tr>`;

  const hiddenBody = ui.showHidden && hiddenGames.length
    ? `<tbody class="hidden-group" aria-label="Hidden games">
        <tr class="group-head"><th colspan="6" scope="rowgroup">Hidden games</th></tr>
        ${hiddenGames.map((g) => rowHTML(g, opts(g, true))).join('')}
      </tbody>`
    : '';

  const toggle = hiddenGames.length
    ? `<div class="lib-hidden-toggle"><button class="text-btn" type="button" data-action="toggle-hidden"
        aria-expanded="${ui.showHidden}">Show hidden (${hiddenGames.length})${icon('chevron-down', { size: 12, className: 'chev' })}</button></div>`
    : '';

  return `<table class="lib-table">
      <colgroup><col class="col-title"><col class="col-genre"><col class="col-source"><col class="col-play"><col class="col-star"><col class="col-more"></colgroup>
      ${headHTML(ui)}
      <tbody class="visible-group">${body}</tbody>
      ${hiddenBody}
    </table>${toggle}`;
}
