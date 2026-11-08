// A tiny observable store.
// Persisted collections (one per IndexedDB object store) live in memory and are mirrored to
// the storage backend on every write. Runtime-only values (route, catalog) use get/set.

export const STORES = ['profile', 'prefs', 'pins', 'hidden', 'recents', 'stats', 'saves'];

const data = Object.fromEntries(STORES.map((s) => [s, {}]));
const runtime = new Map();
const subs = new Map();
let backend = null;

function emit(key) {
  const value = STORES.includes(key) ? data[key] : runtime.get(key);
  for (const fn of [...(subs.get(key) || [])]) {
    try { fn(value); } catch (err) { console.warn(`Subscriber for "${key}" failed`, err); }
  }
}

function persist(promise, what) {
  promise?.catch?.((err) => console.warn(`Could not save ${what}`, err));
}

/** Load every store from the backend into memory. */
export async function init(storageBackend) {
  backend = storageBackend;
  for (const store of STORES) {
    const entries = await backend.getAll(store);
    data[store] = Object.fromEntries(entries);
  }
}

/** "persistent" (IndexedDB) or "session" (memory only). */
export function storageMode() {
  return backend?.mode ?? 'session';
}

export function getAll(store) { return data[store]; }
export function getItem(store, key) { return data[store][key]; }

export function setItem(store, key, value) {
  // Replace the object so subscribers can compare by reference if they want to.
  data[store] = { ...data[store], [key]: value };
  emit(store);
  if (backend) persist(backend.put(store, key, value), `${store}/${key}`);
}

export function removeItem(store, key) {
  if (!(key in data[store])) return;
  const next = { ...data[store] };
  delete next[key];
  data[store] = next;
  emit(store);
  if (backend) persist(backend.delete(store, key), `${store}/${key}`);
}

/** Clear every persisted store, in memory and on disk. */
export async function wipe() {
  for (const store of STORES) {
    data[store] = {};
    if (backend) await backend.clear(store);
    emit(store);
  }
}

export function get(key) { return runtime.get(key); }
export function set(key, value) {
  runtime.set(key, value);
  emit(key);
}

/** Subscribe to a store name or runtime key. Returns an unsubscribe function. */
export function subscribe(key, fn) {
  if (!subs.has(key)) subs.set(key, new Set());
  subs.get(key).add(fn);
  return () => subs.get(key)?.delete(fn);
}

/** Convenience for prefs, the store most UI code touches. */
export function pref(key, fallback) {
  const value = data.prefs[key];
  return value === undefined ? fallback : value;
}
export function setPref(key, value) { setItem('prefs', key, value); }
