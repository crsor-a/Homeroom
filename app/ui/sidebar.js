// Sidebar: comet (home), Explore (Library + Genres), Pinned, Recents, and the avatar button.

import { cometSVG } from '../brand.js';
import { icon } from '../icons.js';
import { esc } from '../dom.js';
import { get, subscribe, pref, setPref } from '../state.js';
import { GENRES, genreLabel, allGames } from '../catalog.js';
import { pinnedGames, recentGames, isHidden } from '../actions.js';
import { libraryHash, playHash } from '../router.js';

const DEFAULT_SECTIONS = { explore: true, genres: true, pinned: true, recents: true };

let root;
let hooks = { renderAvatarButton: null };

function sections() {
  return { ...DEFAULT_SECTIONS, ...pref('sections', {}) };
}

function sectionHTML(key, title, body) {
  const open = sections()[key];
  return `<section class="sb-section" data-section="${key}">
    <button class="sb-head" type="button" aria-expanded="${open}" aria-controls="sb-sec-${key}">
      ${icon('chevron-down', { size: 12 })}<span>${title}</span>
    </button>
    <div class="collapse" id="sb-sec-${key}" data-open="${open}"><div class="collapse-inner">${body}</div></div>
  </section>`;
}

/** Genres that have at least one game the user has not hidden. */
export function visibleGenres() {
  const present = new Set(allGames().filter((g) => !isHidden(g.id)).map((g) => g.genre));
  return GENRES.filter((g) => present.has(g));
}

/** The genre list markup; also used by onboarding for its highlighted replica. */
export function genreListHTML(genres = visibleGenres()) {
  if (!genres.length) return '<li class="sb-empty">No genres yet.</li>';
  return genres.map((g) => `<li><a class="sb-item" href="${libraryHash({ genre: g })}" data-genre="${g}">
      ${icon(g)}<span class="label">${genreLabel(g)}</span></a></li>`).join('');
}

function gameRowsHTML(games, empty) {
  if (!games.length) return `<li class="sb-empty">${empty}</li>`;
  return games.map((g) => `<li><a class="sb-item sb-game" href="${playHash(g.id)}" data-game="${esc(g.id)}">
      <span class="label">${esc(g.title)}</span>${icon('play', { size: 12, className: 'play' })}</a></li>`).join('');
}

function render() {
  const open = sections();
  root.innerHTML = `
    <div class="sb-normal">
      <div class="sb-top"><a class="sb-brand" href="#/" aria-label="Homeroom home">${cometSVG({ size: 22 })}</a></div>
      <nav class="sb-nav" aria-label="Main">
        ${sectionHTML('explore', 'Explore', `<ul class="sb-list">
          <li><a class="sb-item" href="#/library" data-nav="library">${icon('library')}<span class="label">Library</span></a></li>
          <li>
            <button class="sb-item sb-subhead" type="button" aria-expanded="${open.genres}" aria-controls="sb-genres">
              ${icon('genres')}<span class="label">Genres</span>${icon('chevron-down', { size: 12, className: 'chev' })}
            </button>
            <div class="collapse" id="sb-genres" data-open="${open.genres}"><div class="collapse-inner">
              <ul class="sb-list sb-sub" data-list="genres"></ul>
            </div></div>
          </li>
        </ul>`)}
        ${sectionHTML('pinned', 'Pinned', '<ul class="sb-list" data-list="pinned"></ul>')}
        ${sectionHTML('recents', 'Recents', '<ul class="sb-list" data-list="recents"></ul>')}
      </nav>
      <div class="sb-bottom" data-slot="avatar"></div>
    </div>
    <div class="sb-onboarding" hidden></div>`;
  renderLists();
  renderAvatar();
  updateActive();
}

function renderLists() {
  root.querySelector('[data-list="genres"]').innerHTML = genreListHTML();
  root.querySelector('[data-list="pinned"]').innerHTML =
    gameRowsHTML(pinnedGames(), 'Star a game in the Library to pin it here.');
  root.querySelector('[data-list="recents"]').innerHTML =
    gameRowsHTML(recentGames(), 'Games you play will show up here.');
  updateActive();
}

function renderAvatar() {
  const slot = root.querySelector('[data-slot="avatar"]');
  if (hooks.renderAvatarButton) hooks.renderAvatarButton(slot);
  else slot.innerHTML = `<button class="avatar-btn" type="button" disabled>${icon('user', { size: 20 })}<span class="name">You</span></button>`;
}

/** Highlight the link that matches the current route. */
function updateActive() {
  const route = get('route') || { name: 'home', query: {} };
  root.querySelectorAll('[aria-current]').forEach((el) => el.removeAttribute('aria-current'));
  const mark = (sel) => root.querySelectorAll(sel).forEach((el) => el.setAttribute('aria-current', 'page'));
  if (route.name === 'library') {
    if (route.query.genre) mark(`.sb-normal [data-genre="${CSS.escape(route.query.genre)}"]`);
    else mark('[data-nav="library"]');
  } else if (route.name === 'play') {
    mark(`[data-game="${CSS.escape(route.id)}"]`);
  }
}

function toggle(button, key) {
  const panel = document.getElementById(button.getAttribute('aria-controls'));
  const open = button.getAttribute('aria-expanded') !== 'true';
  button.setAttribute('aria-expanded', String(open));
  panel.dataset.open = String(open);
  setPref('sections', { ...sections(), [key]: open });
}

export function initSidebar(el, options = {}) {
  root = el;
  hooks = { ...hooks, ...options };
  render();

  root.addEventListener('click', (e) => {
    const head = e.target.closest('.sb-head');
    if (head) return toggle(head, head.closest('[data-section]').dataset.section);
    const sub = e.target.closest('.sb-subhead');
    if (sub) toggle(sub, 'genres');
  });

  subscribe('route', updateActive);
  ['pins', 'recents', 'hidden', 'catalog'].forEach((k) => subscribe(k, renderLists));
  subscribe('profile', renderAvatar);
  subscribe('storageInfo', renderAvatar);
}

/** Show onboarding content in place of the normal sidebar (or switch back). */
export function sidebarMode(mode) {
  root.querySelector('.sb-normal').hidden = mode === 'onboarding';
  const ob = root.querySelector('.sb-onboarding');
  ob.hidden = mode !== 'onboarding';
  return ob;
}
