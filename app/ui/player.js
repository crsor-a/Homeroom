// Player: runs one game in a sandboxed iframe that fills the canvas, with a slim overlay
// (Fullscreen, Game Info, Close), the SDK bridge for local games, and playtime tracking.

import { esc } from '../dom.js';
import { icon } from '../icons.js';
import { go, lastNonPlayHash } from '../router.js';
import { recordPlayStart, addPlaytime, recordScore, saveGameData, loadGameData } from '../actions.js';
import { openGameInfo } from './gameinfo.js';
import { stateView } from './states.js';

const FLUSH_MS = 15000;
const IDLE_MS = 2000;

// Note: "allow-fullscreen" is not a valid sandbox token (browsers log an error for it).
// Fullscreen is granted through the iframe's `allow` attribute instead.
const SANDBOX = {
  local: 'allow-scripts allow-same-origin allow-pointer-lock',
  embed: 'allow-scripts allow-same-origin allow-popups',
};

export function mountPlayer(view, game) {
  const isEmbed = game.source === 'embed';
  const src = isEmbed ? game.embedUrl : game.entry;

  view.innerHTML = `<div class="player" data-source="${game.source}">
    <div class="player-loading" aria-live="polite">Loading ${esc(game.title)}</div>
    <div class="player-overlay" role="toolbar" aria-label="Game controls">
      <button class="icon-btn" type="button" data-act="fullscreen" aria-label="Fullscreen" title="Fullscreen">${icon('maximize')}</button>
      <button class="icon-btn" type="button" data-act="info" aria-label="Game Info" title="Game Info">${icon('info')}</button>
      <button class="icon-btn" type="button" data-act="close" aria-label="Close game" title="Close">${icon('close')}</button>
    </div>
  </div>`;
  const player = view.querySelector('.player');
  const overlay = view.querySelector('.player-overlay');
  const loading = view.querySelector('.player-loading');

  const frame = document.createElement('iframe');
  frame.className = 'player-frame';
  frame.title = game.title;
  frame.setAttribute('sandbox', isEmbed ? SANDBOX.embed : SANDBOX.local);
  frame.setAttribute('allow', 'fullscreen; gamepad; autoplay');
  if (isEmbed) frame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
  player.prepend(frame);

  let destroyed = false;
  let started = false;

  // ---------- SDK bridge (local games only) ----------
  const post = (msg) => {
    if (isEmbed || !frame.contentWindow) return;
    frame.contentWindow.postMessage(msg, location.origin);
  };
  function onMessage(e) {
    // Embeds are never trusted: they get no SDK traffic in either direction.
    if (isEmbed || e.source !== frame.contentWindow || e.origin !== location.origin) return;
    const msg = e.data;
    if (!msg || typeof msg.type !== 'string') return;
    switch (msg.type) {
      case 'hr:ready': player.dataset.sdk = 'ready'; break;
      case 'hr:score': if (Number.isFinite(msg.value)) recordScore(game.id, msg.value); break;
      case 'hr:save': saveGameData(game.id, msg.data ?? null); break;
      case 'hr:load': post({ type: 'hr:loaded', data: loadGameData(game.id) }); break;
    }
  }
  window.addEventListener('message', onMessage);

  // ---------- Playtime: counts only while the player is visible, the tab is visible and the window has focus ----------
  let pending = 0;
  let last = performance.now();
  let lastFlush = last;
  // document.hasFocus() stays true while focus is inside the game iframe.
  const active = () => started && document.visibilityState === 'visible' && document.hasFocus() && player.isConnected;
  function flush() {
    if (pending > 0) addPlaytime(game.id, pending);
    pending = 0;
    lastFlush = performance.now();
  }
  const ticker = setInterval(() => {
    const now = performance.now();
    if (active()) pending += Math.min(now - last, 2000); // cap, in case timers were throttled
    last = now;
    if (now - lastFlush >= FLUSH_MS) flush();
  }, 1000);

  const onVisibility = () => {
    if (document.visibilityState === 'hidden') { post({ type: 'hr:pause' }); flush(); }
    else post({ type: 'hr:resume' });
  };
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', flush);

  // ---------- Overlay: fades in on mouse move, hides after 2s idle ----------
  let idleTimer = 0;
  function reveal() {
    overlay.classList.add('is-visible');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (!overlay.matches(':hover, :focus-within')) overlay.classList.remove('is-visible');
    }, IDLE_MS);
  }
  player.addEventListener('mousemove', reveal);
  overlay.addEventListener('focusin', reveal);

  // ---------- Overlay actions ----------
  const fsButton = overlay.querySelector('[data-act="fullscreen"]');
  function onFullscreenChange() {
    const on = document.fullscreenElement === player;
    fsButton.innerHTML = icon(on ? 'minimize' : 'maximize');
    fsButton.setAttribute('aria-label', on ? 'Exit fullscreen' : 'Fullscreen');
    fsButton.title = on ? 'Exit fullscreen' : 'Fullscreen';
  }
  document.addEventListener('fullscreenchange', onFullscreenChange);

  overlay.addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'fullscreen') {
      if (document.fullscreenElement) document.exitFullscreen();
      else player.requestFullscreen?.().catch(() => {});
    } else if (act === 'info') {
      post({ type: 'hr:pause' });
      openGameInfo(game.id, { onClose: () => { if (!destroyed) post({ type: 'hr:resume' }); } });
    } else if (act === 'close') {
      go(lastNonPlayHash());
    }
  });

  // ---------- Loading ----------
  frame.addEventListener('load', () => {
    if (destroyed || frame.getAttribute('src') !== src) return;
    loading.hidden = true;
    if (!started) {
      started = true;
      last = performance.now();
      recordPlayStart(game.id);
    }
    // Same-origin local games: watch their mouse moves too, so the overlay can reveal over them.
    if (!isEmbed) {
      try { frame.contentWindow.addEventListener('mousemove', reveal); } catch { /* not reachable */ }
    }
    reveal();
  });

  function showError() {
    loading.hidden = true;
    frame.remove();
    overlay.querySelector('[data-act="fullscreen"]').hidden = true;
    player.append(stateView({
      title: "This game didn't load",
      text: 'Its files may be missing or blocked on this network. Try again, or pick something else from the Library.',
      actions: [
        { label: 'Try again', onClick: () => location.reload() },
        { label: 'Open the Library', primary: true, href: '#/library' },
      ],
    }));
    overlay.classList.add('is-visible');
  }

  if (isEmbed) {
    frame.src = src;
  } else {
    // Local files are on our own origin, so we can check they exist before loading.
    // (Reading the empty body lets the request finish cleanly instead of showing as aborted.)
    fetch(src, { method: 'HEAD', cache: 'no-cache' })
      .then(async (res) => { await res.text(); if (destroyed) return; if (res.ok) frame.src = src; else showError(); })
      .catch(() => { if (!destroyed) showError(); });
  }

  return {
    destroy() {
      destroyed = true;
      flush();
      clearInterval(ticker);
      clearTimeout(idleTimer);
      window.removeEventListener('message', onMessage);
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      if (document.fullscreenElement === player) document.exitFullscreen().catch(() => {});
      // Unload explicitly so audio and timers inside the game stop right away.
      frame.src = 'about:blank';
      frame.remove();
    },
  };
}
