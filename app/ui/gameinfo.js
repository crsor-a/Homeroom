// Game Info popup: everything about one game, plus the player's own stats for it.

import { h, esc, formatPlaytime, formatDate } from '../dom.js';
import { icon } from '../icons.js';
import { subscribe, get } from '../state.js';
import { gameById, genreLabel, tagLabel, SOURCES } from '../catalog.js';
import { statsFor, isPinned, isHidden, togglePin, hideGame, unhideGame } from '../actions.js';
import { go, playHash } from '../router.js';
import { openDialog } from './dialog.js';
import { sourceLabelHTML } from './library-rows.js';

function licenseHTML(g) {
  if (g.source === 'embed') return 'Loaded from the official site. Homeroom does not host or license this game.';
  const l = g.license || {};
  const parts = [`Code: ${esc(l.code || 'Unknown')}`, `Assets: ${esc(l.assets || 'Unknown')}`];
  if (l.upstream) {
    parts.push(`<a href="${esc(l.upstream)}" target="_blank" rel="noopener noreferrer">Upstream project ${icon('link', { size: 12 })}</a>`);
  }
  return parts.join(' <span class="dot" aria-hidden="true"></span> ');
}

function bodyHTML(g) {
  const s = statsFor(g.id);
  const alt = g.originalAlternative && gameById(g.originalAlternative);
  const tags = g.tags.map((t) => `<span class="pill">${esc(tagLabel(t))}</span>`).join('');
  return `
    <p class="gi-desc">${esc(g.description)}</p>
    <dl class="gi-meta">
      <dt>Source</dt><dd>${sourceLabelHTML(g.source)}<p class="gi-note">${esc(SOURCES[g.source].tip)}</p></dd>
      <dt>Genre</dt><dd>${genreLabel(g.genre)}</dd>
      <dt>Tags</dt><dd><div class="pills">${tags}</div></dd>
      <dt>License</dt><dd class="gi-license">${licenseHTML(g)}</dd>
      ${alt ? `<dt>Original</dt><dd><a class="pill pill-orig" href="${playHash(alt.id)}" data-close>Original available: ${esc(alt.title)}</a></dd>` : ''}
    </dl>
    <h3 class="gi-subhead">Your stats</h3>
    <dl class="gi-stats">
      <div><dt>Total playtime</dt><dd data-stat="playtime">${formatPlaytime(s.playMs)}</dd></div>
      <div><dt>Times played</dt><dd data-stat="plays">${s.plays}</dd></div>
      <div><dt>Last played</dt><dd data-stat="last">${formatDate(s.lastPlayed)}</dd></div>
      <div><dt>Best score</dt><dd data-stat="best">${s.bestScore == null ? 'None yet' : s.bestScore.toLocaleString()}</dd></div>
    </dl>`;
}

/** Open Game Info for `id`. onOpen/onClose let the player pause and resume the game. */
export function openGameInfo(id, { onClose } = {}) {
  const g = gameById(id);
  if (!g) return null;
  const body = h('div', { class: 'gi', html: bodyHTML(g) });

  const dlg = openDialog({
    title: g.title,
    className: 'dialog-gameinfo',
    body,
    onClose: () => { unsubs.forEach((u) => u()); onClose?.(); },
  });

  function actions() {
    const route = get('route');
    const playing = route?.name === 'play' && route.id === id;
    const hidden = isHidden(id);
    return [
      { label: hidden ? 'Unhide' : 'Hide', onClick: () => (hidden ? unhideGame(id) : hideGame(id)) },
      { label: isPinned(id) ? 'Unstar' : 'Star', onClick: () => togglePin(id) },
      { label: playing ? 'Back to game' : 'Play', primary: true, onClick: (close) => { close(); if (!playing) go(playHash(id)); } },
    ];
  }
  dlg.setActions(actions());

  // Following a link inside (the Original alternative) should also close the dialog.
  body.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) dlg.close(); });

  const refresh = () => {
    const focusedLabel = document.activeElement?.closest?.('.dialog-footer') ? document.activeElement.textContent : null;
    body.innerHTML = bodyHTML(g);
    dlg.setActions(actions());
    // Keep focus on the footer button the user just pressed (its label may have flipped).
    if (focusedLabel) {
      const buttons = [...dlg.footer.querySelectorAll('button')];
      const map = { Star: 'Unstar', Unstar: 'Star', Hide: 'Unhide', Unhide: 'Hide' };
      (buttons.find((b) => b.textContent === map[focusedLabel] || b.textContent === focusedLabel) || buttons[0])?.focus();
    }
  };
  const unsubs = ['stats', 'pins', 'hidden'].map((k) => subscribe(k, refresh));
  return dlg;
}
