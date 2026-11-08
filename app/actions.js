// User actions shared by the sidebar, library, player and popups.
// Everything goes through state.js, so the UI updates reactively and storage stays in sync.

import { getAll, getItem, setItem, removeItem } from './state.js';
import { gameById } from './catalog.js';

const RECENTS_LIMIT = 10;

export const isPinned = (id) => !!getItem('pins', id);
export const isHidden = (id) => !!getItem('hidden', id);

export function togglePin(id) {
  if (isPinned(id)) removeItem('pins', id);
  else setItem('pins', id, { pinnedAt: Date.now() });
}

export function hideGame(id) { setItem('hidden', id, { hiddenAt: Date.now() }); }
export function unhideGame(id) { removeItem('hidden', id); }

/** Games starred in the library, oldest first (newest at the bottom). */
export function pinnedGames() {
  return Object.entries(getAll('pins'))
    .sort((a, b) => a[1].pinnedAt - b[1].pinnedAt)
    .map(([id]) => gameById(id))
    .filter((g) => g && !isHidden(g.id));
}

/** The last 10 played games, newest first. */
export function recentGames() {
  return Object.entries(getAll('recents'))
    .sort((a, b) => b[1].playedAt - a[1].playedAt)
    .map(([id]) => gameById(id))
    .filter((g) => g && !isHidden(g.id));
}

export function statsFor(id) {
  return { playMs: 0, plays: 0, lastPlayed: null, bestScore: null, ...getItem('stats', id) };
}

/** Called when a game loads in the player: add to Recents, count the play. */
export function recordPlayStart(id) {
  const now = Date.now();
  setItem('recents', id, { playedAt: now });
  const entries = Object.entries(getAll('recents')).sort((a, b) => b[1].playedAt - a[1].playedAt);
  entries.slice(RECENTS_LIMIT).forEach(([oldId]) => removeItem('recents', oldId));
  const s = statsFor(id);
  setItem('stats', id, { ...s, plays: s.plays + 1, lastPlayed: now });
}

export function addPlaytime(id, ms) {
  if (!(ms > 0)) return;
  const s = statsFor(id);
  setItem('stats', id, { ...s, playMs: s.playMs + Math.round(ms) });
}

export function recordScore(id, value) {
  const s = statsFor(id);
  if (s.bestScore == null || value > s.bestScore) setItem('stats', id, { ...s, bestScore: value });
}

export function saveGameData(id, data) { setItem('saves', id, data); }
export function loadGameData(id) { return getItem('saves', id) ?? null; }

/** Totals for the profile popover. */
export function totals() {
  const stats = getAll('stats');
  let playMs = 0;
  let played = 0;
  let top = null;
  for (const [id, s] of Object.entries(stats)) {
    playMs += s.playMs || 0;
    if (s.plays > 0) played += 1;
    if (gameById(id) && (!top || (s.playMs || 0) > top.playMs)) top = { id, playMs: s.playMs || 0 };
  }
  return { playMs, played, mostPlayed: top && top.playMs > 0 ? gameById(top.id) : null };
}
