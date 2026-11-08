// The game catalog: loading, schema checks, display labels, search, filter and sort helpers.

export const GENRES = ['racing', 'action', 'adventure', 'sandbox', 'sports', 'puzzle', 'arcade',
  'strategy', 'horror', 'rhythm', 'party', 'idle', 'card-board'];

export const GENRE_LABELS = {
  racing: 'Racing', action: 'Action', adventure: 'Adventure', sandbox: 'Sandbox', sports: 'Sports',
  puzzle: 'Puzzle', arcade: 'Arcade', strategy: 'Strategy', horror: 'Horror', rhythm: 'Rhythm',
  party: 'Party', idle: 'Idle', 'card-board': 'Card & Board',
};

// Fixed vocabulary. Add new tags here first (CLAUDE.md section 6).
export const TAG_LABELS = {
  '2d': '2D', '3d': '3D', singleplayer: 'Singleplayer', 'two-player': 'Two-player', 'co-op': 'Co-op',
  'multiplayer-bots': 'Bots', cars: 'Cars', physics: 'Physics', elimination: 'Elimination',
  endless: 'Endless', story: 'Story', 'short-sessions': 'Short sessions', 'long-sessions': 'Long sessions',
  keyboard: 'Keyboard', mouse: 'Mouse', gamepad: 'Gamepad', shooting: 'Shooting', platformer: 'Platformer',
  building: 'Building', survival: 'Survival', 'puzzle-logic': 'Logic', rhythm: 'Rhythm', retro: 'Retro',
  chill: 'Chill', hard: 'Hard',
};
export const TAGS = Object.keys(TAG_LABELS);

export const SOURCES = {
  original: {
    label: 'Original', plural: 'Originals',
    tip: 'Made for Homeroom. Inspired by popular games, built from scratch, and hosted here. The safest bet.',
  },
  unblocked: {
    label: 'Unblocked', plural: 'Unblocked',
    tip: 'An open-source game, hosted by Homeroom exactly as its creators made it. Some advanced filters can still catch these.',
  },
  embed: {
    label: 'Embed', plural: 'Embed',
    tip: "Loaded from the game's official site, not hosted by Homeroom. Many filters block these, and they may show the publisher's ads.",
  },
};
const SOURCE_ORDER = { original: 0, unblocked: 1, embed: 2 };

export const genreLabel = (g) => GENRE_LABELS[g] || g;
export const tagLabel = (t) => TAG_LABELS[t] || t;
export const sourceLabel = (s) => SOURCES[s]?.label || s;

/**
 * Check one entry against the schema. Returns a list of problems (empty = valid).
 * The legal guardrails from CLAUDE.md section 2 are enforced here.
 */
export function validateEntry(g) {
  const problems = [];
  if (!g || typeof g !== 'object') return ['not an object'];
  if (!/^[a-z0-9-]+$/.test(g.id || '')) problems.push('id must be lowercase letters, digits and dashes');
  if (!g.title) problems.push('missing title');
  if (!GENRES.includes(g.genre)) problems.push(`unknown genre "${g.genre}"`);
  if (!SOURCES[g.source]) problems.push(`unknown source "${g.source}"`);
  if (!Array.isArray(g.tags)) problems.push('tags must be an array');
  else g.tags.filter((t) => !TAG_LABELS[t]).forEach((t) => problems.push(`unknown tag "${t}"`));
  if (g.source === 'embed') {
    if (!g.embedUrl) problems.push('embed entries need embedUrl');
    if (g.entry) problems.push('embed entries must not have a local entry (never rehost)');
  } else if (g.source) {
    if (!g.entry) problems.push('local entries need entry');
    if (g.embedUrl) problems.push('local entries must not have embedUrl');
  }
  if (g.source === 'unblocked' && !(g.license?.code && g.license?.assets)) {
    problems.push('unblocked entries need code and asset licenses');
  }
  return problems;
}

let games = [];
let byIdMap = new Map();

/** Fetch and validate games/catalog.json. Invalid entries are dropped with a warning. */
export async function loadCatalog(url = 'games/catalog.json') {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Catalog request failed (${res.status})`);
  const raw = await res.json();
  if (!Array.isArray(raw)) throw new Error('Catalog is not a list');
  const seen = new Set();
  games = raw.filter((g) => {
    const problems = validateEntry(g);
    if (seen.has(g?.id)) problems.push('duplicate id');
    if (problems.length) {
      console.warn(`Skipping catalog entry "${g?.id}": ${problems.join('; ')}`);
      return false;
    }
    seen.add(g.id);
    return true;
  });
  byIdMap = new Map(games.map((g) => [g.id, g]));
  return games;
}

export const allGames = () => games;
export const gameById = (id) => byIdMap.get(id);

/** Lowercase search text for a game: title, description, tag ids and labels, genre. */
function haystack(g) {
  return [g.title, g.description, genreLabel(g.genre), ...g.tags, ...g.tags.map(tagLabel)]
    .join(' ').toLowerCase();
}

/** Filters combine with AND; every search word must match somewhere; tags are all required. */
export function matches(g, { q = '', genre = '', source = 'all', tags = [] } = {}) {
  if (genre && g.genre !== genre) return false;
  if (source && source !== 'all' && g.source !== source) return false;
  if (tags.length && !tags.every((t) => g.tags.includes(t))) return false;
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length) {
    const text = haystack(g);
    if (!words.every((w) => text.includes(w))) return false;
  }
  return true;
}

export function sortGames(list, key = 'title', dir = 1) {
  const byTitle = (a, b) => a.title.localeCompare(b.title);
  const cmp = {
    title: byTitle,
    genre: (a, b) => genreLabel(a.genre).localeCompare(genreLabel(b.genre)) || byTitle(a, b),
    source: (a, b) => SOURCE_ORDER[a.source] - SOURCE_ORDER[b.source] || byTitle(a, b),
  }[key] || byTitle;
  return [...list].sort((a, b) => cmp(a, b) * dir);
}
