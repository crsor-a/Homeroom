// Library: a plain, sortable, filterable table of every game.
// Filters live in the URL (#/library?q=&genre=&source=&tag=a,b&sort=&dir=) via replaceState.

import { icon } from '../icons.js';
import { esc } from '../dom.js';
import { subscribe, getAll } from '../state.js';
import { allGames, matches, sortGames, GENRES, genreLabel, TAGS, tagLabel, SOURCES } from '../catalog.js';
import { togglePin, hideGame, unhideGame, isPinned } from '../actions.js';
import { replace, go, libraryHash, playHash } from '../router.js';
import { tableHTML } from './library-rows.js';
import { openMenu } from './menu.js';
import { openGameInfo } from './gameinfo.js';

const SORTS = ['title', 'genre', 'source'];

function fromQuery(q = {}) {
  return {
    q: q.q || '',
    genre: GENRES.includes(q.genre) ? q.genre : '',
    source: SOURCES[q.source] ? q.source : 'all',
    tags: (q.tag || '').split(',').filter((t) => TAGS.includes(t)),
    sort: SORTS.includes(q.sort) ? q.sort : 'title',
    dir: q.dir === 'desc' ? -1 : 1,
  };
}

function toQuery(f) {
  return {
    q: f.q, genre: f.genre, source: f.source === 'all' ? '' : f.source,
    tag: f.tags.join(','), sort: f.sort === 'title' ? '' : f.sort, dir: f.dir === -1 ? 'desc' : '',
  };
}

const sameFilters = (a, b) => JSON.stringify(toQuery(a)) === JSON.stringify(toQuery(b));

/**
 * Mount the library into `view`.
 * readOnly + games: a static render for onboarding (no URL sync, no state writes).
 */
export function mountLibrary(view, { query = {}, readOnly = false, games = null } = {}) {
  const ui = { ...fromQuery(query), expanded: null, showHidden: false, focusId: null };
  const source = () => games || allGames();
  const hiddenIds = () => (readOnly ? new Set() : new Set(Object.keys(getAll('hidden'))));
  const filtersActive = () => !!(ui.q || ui.genre || ui.source !== 'all' || ui.tags.length);

  view.innerHTML = `<div class="library">
    <div class="lib-toolbar">
      <label class="lib-search">${icon('search')}
        <input class="input" type="search" placeholder="Search" aria-label="Search games" autocomplete="off" spellcheck="false">
      </label>
      <select class="input lib-genre" aria-label="Genre"></select>
      <div class="segmented" role="radiogroup" aria-label="Source">
        ${['all', 'original', 'unblocked', 'embed'].map((s) => `<button type="button" role="radio" data-source="${s}">
          ${s === 'all' ? 'All' : SOURCES[s].plural}</button>`).join('')}
      </div>
      <div class="lib-spacer"></div>
      <button class="text-btn lib-clear" type="button" data-action="clear" hidden>Clear filters</button>
      <span class="lib-count" aria-live="polite"></span>
    </div>
    <div class="lib-tags" role="group" aria-label="Filter by tag"></div>
    <div class="lib-scroll"><div class="lib-list"></div></div>
  </div>`;

  const $ = (sel) => view.querySelector(sel);
  const search = $('.lib-search input');
  const genreSel = $('.lib-genre');
  const seg = $('.segmented');
  const tagsRow = $('.lib-tags');
  const list = $('.lib-list');

  function syncControls() {
    if (search.value !== ui.q) search.value = ui.q;
    const genres = GENRES.filter((g) => g === ui.genre || source().some((x) => x.genre === g));
    genreSel.innerHTML = `<option value="">All genres</option>` +
      genres.map((g) => `<option value="${g}">${genreLabel(g)}</option>`).join('');
    genreSel.value = ui.genre;
    seg.querySelectorAll('[role="radio"]').forEach((b) => {
      const on = b.dataset.source === ui.source;
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = on ? 0 : -1;
    });
    const used = new Set(source().flatMap((g) => g.tags));
    tagsRow.innerHTML = TAGS.filter((t) => used.has(t) || ui.tags.includes(t)).map((t) =>
      `<button class="chip" type="button" data-tag="${t}" aria-pressed="${ui.tags.includes(t)}">${esc(tagLabel(t))}</button>`).join('');
    $('.lib-clear').hidden = !filtersActive();
  }

  function renderList() {
    const hidden = hiddenIds();
    const matching = sortGames(source().filter((g) => matches(g, ui)), ui.sort, ui.dir);
    const visible = matching.filter((g) => !hidden.has(g.id));
    const hiddenGames = matching.filter((g) => hidden.has(g.id));
    if (!hiddenGames.length) ui.showHidden = false;
    const pinnedIds = new Set(readOnly ? [] : Object.keys(getAll('pins')));

    // Remember what had focus so a re-render does not drop the keyboard user's place.
    const active = document.activeElement;
    const focusRow = list.contains(active) ? active.closest('tr.row')?.dataset.id : null;
    const focusAction = focusRow && active.dataset.action;

    list.innerHTML = tableHTML({ games: visible, hiddenGames, ui, pinnedIds, filtersActive: filtersActive() });
    $('.lib-count').textContent = `${visible.length} ${visible.length === 1 ? 'game' : 'games'}`;

    if (focusRow) {
      const row = list.querySelector(`tr.row[data-id="${CSS.escape(focusRow)}"]`);
      const target = row && (focusAction ? row.querySelector(`[data-action="${focusAction}"]`) : row);
      (target || row)?.focus();
    }
  }

  function commit() {
    if (!readOnly) replace(libraryHash(toQuery(ui)));
    syncControls();
    renderList();
  }

  // ----- Toolbar events -----
  search.addEventListener('input', () => { ui.q = search.value; ui.expanded = null; commit(); });
  genreSel.addEventListener('change', () => { ui.genre = genreSel.value; commit(); });
  seg.addEventListener('click', (e) => {
    const b = e.target.closest('[role="radio"]');
    if (b) { ui.source = b.dataset.source; commit(); seg.querySelector(`[data-source="${ui.source}"]`).focus(); }
  });
  seg.addEventListener('keydown', (e) => {
    const order = ['all', 'original', 'unblocked', 'embed'];
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    ui.source = order[(order.indexOf(ui.source) + step + order.length) % order.length];
    commit();
    seg.querySelector(`[data-source="${ui.source}"]`).focus();
  });
  tagsRow.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    const t = chip.dataset.tag;
    ui.tags = ui.tags.includes(t) ? ui.tags.filter((x) => x !== t) : [...ui.tags, t];
    commit();
    tagsRow.querySelector(`[data-tag="${t}"]`)?.focus();
  });
  view.addEventListener('click', (e) => {
    if (e.target.closest('[data-action="clear"]')) {
      Object.assign(ui, { q: '', genre: '', source: 'all', tags: [] });
      commit();
      search.focus();
    }
  });

  // ----- Table events -----
  function rowMenu(row, anchor) {
    const id = row.dataset.id;
    const hidden = row.classList.contains('is-hidden');
    const info = { label: 'Game Info', icon: 'info', onSelect: () => openGameInfo(id) };
    const items = hidden
      ? [info, { label: 'Unhide', icon: 'eye', onSelect: () => unhideGame(id) }]
      : [info,
        { label: isPinned(id) ? 'Unstar' : 'Star', icon: isPinned(id) ? 'star-fill' : 'star', onSelect: () => togglePin(id) },
        'separator',
        { label: 'Hide game', icon: 'eye-off', onSelect: () => hideGame(id) }];
    openMenu(anchor, items, { label: 'Game options' });
  }

  function toggleExpand(id) {
    ui.expanded = ui.expanded === id ? null : id;
    ui.focusId = id;
    ui.justExpanded = ui.expanded; // animate only the row that just opened
    renderList();
    ui.justExpanded = null;
  }

  list.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el || readOnly) return;
    const row = el.closest('tr.row');
    const id = row?.dataset.id;
    if (row) ui.focusId = id;
    switch (el.dataset.action) {
      case 'sort': {
        const key = el.dataset.sort;
        ui.dir = ui.sort === key ? -ui.dir : 1;
        ui.sort = key;
        commit();
        list.querySelector(`[data-sort="${key}"]`)?.focus();
        break;
      }
      case 'expand': toggleExpand(id); break;
      case 'star': togglePin(id); break;
      case 'more': rowMenu(row, el); break;
      case 'toggle-hidden':
        ui.showHidden = !ui.showHidden;
        renderList();
        list.querySelector('[data-action="toggle-hidden"]')?.focus();
        break;
      case 'tag': {
        const t = el.dataset.tag;
        if (!ui.tags.includes(t)) ui.tags = [...ui.tags, t];
        commit();
        break;
      }
    }
  });

  // Row keyboard: arrows move, Enter plays, Space expands, S stars.
  list.addEventListener('keydown', (e) => {
    const row = e.target;
    if (!row.matches?.('tr.row') || e.altKey || e.ctrlKey || e.metaKey) return;
    const rows = [...list.querySelectorAll('tr.row')];
    const i = rows.indexOf(row);
    const move = (j) => {
      const next = rows[Math.max(0, Math.min(rows.length - 1, j))];
      rows.forEach((r) => { r.tabIndex = r === next ? 0 : -1; });
      ui.focusId = next.dataset.id;
      next.focus();
    };
    const id = row.dataset.id;
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); move(i + 1); break;
      case 'ArrowUp': e.preventDefault(); move(i - 1); break;
      case 'Home': e.preventDefault(); move(0); break;
      case 'End': e.preventDefault(); move(rows.length - 1); break;
      case 'Enter': e.preventDefault(); go(playHash(id)); break;
      case ' ': e.preventDefault(); toggleExpand(id); break;
      case 's': case 'S': e.preventDefault(); ui.focusId = id; togglePin(id); break;
    }
  });
  list.addEventListener('focusin', (e) => {
    const row = e.target.closest('tr.row');
    if (row) ui.focusId = row.dataset.id;
  });

  syncControls();
  renderList();

  const unsubs = readOnly ? [] : ['pins', 'hidden', 'catalog'].map((k) => subscribe(k, () => { syncControls(); renderList(); }));

  return {
    update(query) {
      const next = fromQuery(query);
      if (sameFilters(next, ui)) return;
      Object.assign(ui, next, { expanded: null });
      syncControls();
      renderList();
    },
    destroy() { unsubs.forEach((u) => u()); },
  };
}
