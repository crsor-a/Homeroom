// Boot: gate check, then storage, then the shell (and onboarding on first visit).
import { applyFavicon } from './brand.js';
import * as state from './state.js';
import { openStorage } from './storage.js';
import { loadCatalog } from './catalog.js';
import { start as startRouter } from './router.js';
import { initSidebar } from './ui/sidebar.js';
import { initCanvas } from './ui/canvas.js';
import { initTooltips } from './ui/tooltip.js';

async function boot() {
  applyFavicon();
  await state.init(await openStorage());

  try {
    state.set('catalog', await loadCatalog());
  } catch (err) {
    console.warn('Catalog failed to load', err);
    state.set('catalogError', String(err?.message || err));
    state.set('catalog', []);
  }

  initTooltips();
  initSidebar(document.getElementById('sidebar'));
  startRouter();
  initCanvas(document.getElementById('canvas'));
  document.getElementById('app').hidden = false;
}

boot();
