// Boot: gate check, then storage, then the shell (and onboarding on first visit).
import { applyFavicon, cometSVG } from './brand.js';

function boot() {
  applyFavicon();
  const app = document.getElementById('app');
  const sidebar = document.getElementById('sidebar');
  sidebar.innerHTML = `<div class="sb-normal"><div class="sb-top">
    <a class="sb-brand" href="#/" aria-label="Homeroom home">${cometSVG({ size: 22 })}</a>
  </div><nav class="sb-nav" aria-label="Main"></nav></div>`;
  app.hidden = false;
}

boot();
