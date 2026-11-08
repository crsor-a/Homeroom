// Storage backends. Every backend has the same shape:
//   { mode, getAll(store) -> [[key, value]], put(store, key, value), delete(store, key), clear(store) }
// Phase 4 adds the IndexedDB backend; until then everything is in memory.

import { STORES } from './state.js';

/** In-memory backend, used when IndexedDB is unavailable (some private windows). */
export function memoryBackend() {
  const maps = Object.fromEntries(STORES.map((s) => [s, new Map()]));
  return {
    mode: 'session',
    async getAll(store) { return [...maps[store].entries()]; },
    async put(store, key, value) { maps[store].set(key, value); },
    async delete(store, key) { maps[store].delete(key); },
    async clear(store) { maps[store].clear(); },
  };
}

export async function openStorage() {
  return memoryBackend();
}
