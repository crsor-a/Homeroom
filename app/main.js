// Boot: gate check, then storage, then the shell (and onboarding on first visit).
import { applyFavicon } from './brand.js';
import * as state from './state.js';
import { openStorage, requestPersistence, isPersisted } from './storage.js';
import { loadCatalog } from './catalog.js';
import { start as startRouter, go } from './router.js';
import { initSidebar } from './ui/sidebar.js';
import { initCanvas } from './ui/canvas.js';
import { initTooltips } from './ui/tooltip.js';
import { ensureProfile, renderAvatarButton } from './ui/profile.js';
import { startOnboarding } from './ui/onboarding.js';
import { shouldGate, renderGate } from './ui/gate.js';

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
  document.getElementById('app').hidden = gated;

  if (!state.pref('onboarded')) startOnboarding();
  // "Replay onboarding" in the profile popover asks for a fresh run on the blank canvas.
  state.subscribe('onboardingRequest', () => { go('#/'); startOnboarding(); });
}

// ---------- Gate first: on phones and narrow windows nothing else loads ----------
let gated = false;
let booted = false;

function checkGate() {
  gated = shouldGate();
  const gate = document.getElementById('gate');
  const app = document.getElementById('app');
  gate.hidden = !gated;
  document.querySelector('.skip-link').hidden = gated;
  if (gated) {
    if (!gate.childElementCount) renderGate(gate);
    app.hidden = true;
  } else if (!booted) {
    booted = true;
    boot();
  } else {
    app.hidden = false;
  }
}

applyFavicon();
checkGate();
// Re-check when the window is resized or a pointer is plugged in or removed.
window.addEventListener('resize', checkGate);
matchMedia('(any-pointer: fine)').addEventListener?.('change', checkGate);
