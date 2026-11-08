// Boot: gate check, then storage, then the shell (and onboarding on first visit).
import { applyFavicon } from './brand.js';
import * as state from './state.js';
import { openStorage, requestPersistence, isPersisted } from './storage.js';
import { loadCatalog } from './catalog.js';
import { start as startRouter } from './router.js';
import { initSidebar } from './ui/sidebar.js';
import { initCanvas } from './ui/canvas.js';
import { initTooltips } from './ui/tooltip.js';
import { ensureProfile, renderAvatarButton } from './ui/profile.js';

/** On first run ask the browser to keep our data, record the answer, and expose it to the UI. */
async function checkPersistence() {
  const mode = state.storageMode();
  let persisted = false;
  if (mode === 'persistent') {
    if (state.pref('persisted') === undefined) {
      persisted = await requestPersistence();
      state.setPref('persisted', persisted);
    } else {
      persisted = await isPersisted();
      if (persisted !== state.pref('persisted')) state.setPref('persisted', persisted);
    }
  }
  state.set('storageInfo', { mode, persisted });
}

async function boot() {
  applyFavicon();
  await state.init(await openStorage());
  await checkPersistence();
  ensureProfile();

  try {
    state.set('catalog', await loadCatalog());
  } catch (err) {
    console.warn('Catalog failed to load', err);
    state.set('catalogError', String(err?.message || err));
    state.set('catalog', []);
  }

  initTooltips();
  initSidebar(document.getElementById('sidebar'), { renderAvatarButton });
  startRouter();
  initCanvas(document.getElementById('canvas'));
  document.getElementById('app').hidden = false;
}

boot();
