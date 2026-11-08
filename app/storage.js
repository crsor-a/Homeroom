// Storage backends. Every backend has the same shape:
//   { mode, getAll(store) -> [[key, value]], put(store, key, value), delete(store, key), clear(store) }
// IndexedDB is the real one; the in-memory backend covers browsers that block it (some private windows).

import { STORES } from './state.js';

const DB_NAME = 'homeroom';
const DB_VERSION = 1;

/** In-memory backend: works for this tab only, nothing survives a reload. */
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

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      // Out-of-line keys: the key is passed to put() separately (gameId, "me", pref name).
      for (const store of STORES) if (!db.objectStoreNames.contains(store)) db.createObjectStore(store);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('IndexedDB open was blocked by another tab'));
  });
}

/** Run one request in its own transaction; resolves when the transaction commits. */
function run(db, store, mode, makeRequest) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const result = makeRequest(tx.objectStore(store));
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('Transaction aborted'));
  });
}

async function indexedDBBackend() {
  const db = await openDB();
  // Another tab upgrading the schema should not be blocked by us.
  db.onversionchange = () => db.close();
  return {
    mode: 'persistent',
    async getAll(store) {
      const out = {};
      await run(db, store, 'readonly', (os) => {
        const keys = os.getAllKeys();
        const values = os.getAll();
        values.onsuccess = () => { out.pairs = keys.result.map((k, i) => [k, values.result[i]]); };
      });
      return out.pairs || [];
    },
    put: (store, key, value) => run(db, store, 'readwrite', (os) => { os.put(value, key); }),
    delete: (store, key) => run(db, store, 'readwrite', (os) => { os.delete(key); }),
    clear: (store) => run(db, store, 'readwrite', (os) => { os.clear(); }),
  };
}

/** IndexedDB when it works (including a test write), otherwise memory. */
export async function openStorage() {
  try {
    if (!('indexedDB' in window) || !window.indexedDB) throw new Error('IndexedDB not available');
    const backend = await indexedDBBackend();
    await backend.put('prefs', '__probe', Date.now());
    await backend.delete('prefs', '__probe');
    return backend;
  } catch (err) {
    console.warn('Falling back to session-only storage:', err?.message || err);
    return memoryBackend();
  }
}

/** Ask the browser not to evict our data. Resolves true if persistence is granted. */
export async function requestPersistence() {
  try {
    if (!navigator.storage?.persist) return false;
    if (await navigator.storage.persisted?.()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

/** Current persistence status without prompting. */
export async function isPersisted() {
  try { return !!(await navigator.storage?.persisted?.()); } catch { return false; }
}
