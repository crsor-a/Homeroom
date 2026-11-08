// Onboarding: runs inside the sidebar (step cards with Back / Next / Skip and step dots)
// while the canvas illustrates each step. Runs on first visit and from "Replay onboarding".

import { h, esc } from '../dom.js';
import { icon } from '../icons.js';
import { cometSVG } from '../brand.js';
import { setPref } from '../state.js';
import { SOURCES, tagLabel } from '../catalog.js';
import { sidebarMode, genreListHTML } from './sidebar.js';
import { sourceLabelHTML } from './library-rows.js';
import { mountLibrary } from './library.js';
import { closePopover } from './menu.js';
import { avatarSVG } from './avatar.js';
import { getProfile, updateProfile, ensureProfile, avatarPickerHTML } from './profile.js';

// Static, made-up rows for the non-interactive sample library (step 4).
const SAMPLE = [
  ['paper-planes', 'Paper Planes', 'arcade', 'original', ['2d', 'endless', 'chill']],
  ['orbit-golf', 'Orbit Golf', 'sports', 'original', ['2d', 'physics', 'short-sessions']],
  ['lantern-maze', 'Lantern Maze', 'puzzle', 'unblocked', ['2d', 'puzzle-logic', 'retro']],
  ['drift-club', 'Drift Club', 'racing', 'embed', ['3d', 'cars', 'singleplayer']],
  ['tower-tactics', 'Tower Tactics', 'strategy', 'unblocked', ['2d', 'building', 'long-sessions']],
  ['last-light', 'Last Light', 'horror', 'embed', ['3d', 'survival', 'story']],
].map(([id, title, genre, source, tags]) => ({ id, title, genre, source, tags, description: 'Sample game.', originalAlternative: null }));

const QUICK_COLORS = ['blue', 'purple', 'pink', 'orange', 'green', 'graphite'];
const QUICK_SYMBOLS = ['comet', 'star', 'moon', 'bolt', 'leaf', 'wave', 'flame', 'initials'];

const sourcesHTML = () => `<dl class="ob-sources">
  ${['original', 'unblocked', 'embed'].map((s) => `<div><dt>${sourceLabelHTML(s)}</dt><dd>${esc(SOURCES[s].tip)}
    ${s === 'original' ? " Since they're new, you may not have heard of them, and quality varies while we build them out." : ''}
    ${s === 'embed' ? " If we've made an Original alternative, the game will say so." : ''}</dd></div>`).join('')}
</dl>`;

// Each step: sidebar card content, optional sidebar extra above the card, and a canvas illustration.
const STEPS = [
  {
    title: 'Welcome to Homeroom.',
    body: "<p>Let's get you set up.</p>",
    stage: (el) => { el.innerHTML = `<div class="ob-hero">${cometSVG({ size: 96 })}</div>`; },
  },
  {
    title: 'A home for browser games',
    body: '<p>Homeroom is a collection of browser games you can play right here: some made just for Homeroom, some open-source classics, and some loaded from their official sites.</p>',
    stage: (el) => {
      el.innerHTML = `<div class="ob-trio">${['Made for Homeroom', 'Open-source classics', 'From official sites']
        .map((t) => `<span class="ob-chip-lg">${t}</span>`).join('')}</div>`;
    },
  },
  {
    title: 'The Game Canvas',
    body: '<p>To your right is the Game Canvas. It stays blank until you open a game or the Library.</p>',
    stage: (el) => { el.classList.add('ob-pulse'); el.innerHTML = '<span class="ob-caption">Game Canvas</span>'; },
  },
  {
    title: 'The Library',
    body: '<p>This is the Library: the full roster of games on Homeroom. Filter by genre, tags and source, or search for a title.</p>',
    stage: (el) => {
      const frame = h('div', { class: 'ob-sample', inert: true, 'aria-hidden': 'true' });
      const view = h('div', { class: 'view' });
      frame.append(view, h('span', { class: 'pill ob-sample-tag' }, 'Sample'));
      el.append(frame);
      mountLibrary(view, { readOnly: true, games: SAMPLE });
    },
  },
  {
    title: 'Genres and tags',
    extra: () => `<div class="ob-highlight" inert aria-hidden="true">
      <div class="sb-item">${icon('genres')}<span class="label">Genres</span></div>
      <ul class="sb-list sb-sub">${genreListHTML()}</ul></div>`,
    body: "<p>Genres sort games by type. Tags are more specific, like Cars, Elimination, 3D or Two-player, and you'll find them as filters in the Library.</p>",
    stage: (el) => {
      el.innerHTML = `<div class="ob-trio">${['cars', 'elimination', '3d', 'two-player']
        .map((t, i) => `<span class="chip" aria-pressed="${i % 2 === 0}">${tagLabel(t)}</span>`).join('')}</div>`;
    },
  },
  {
    title: 'Three sources',
    body: () => `<p>Every game comes from one of three sources:</p>${sourcesHTML()}`,
    stage: (el) => {
      el.innerHTML = `<div class="ob-trio ob-trio-lg">${['original', 'unblocked', 'embed']
        .map((s) => `<span class="source-label">${SOURCES[s].label}</span>`).join('')}</div>`;
    },
  },
  {
    title: 'What should we call you?',
    body: () => {
      const p = getProfile();
      return `<label class="ob-label" for="ob-name">Name (optional)</label>
        <input id="ob-name" class="input ob-name" type="text" maxlength="24" value="${esc(p.name)}" placeholder="Your name" autocomplete="off" spellcheck="false">
        <div class="ob-picker">${avatarPickerHTML(p.avatar, p.name, { colors: QUICK_COLORS, symbols: QUICK_SYMBOLS, group: 'ob' })}</div>
        <p class="ob-fine">Homeroom saves your pins, preferences and stats, like playtime, in this browser. You'll find them in Game Info and your profile. Browsers can clear this data, so don't depend on it.</p>`;
    },
    stage: (el) => {
      const p = getProfile();
      el.innerHTML = `<div class="ob-avatar">${avatarSVG(p.avatar, { size: 120, name: p.name })}
        <span class="ob-avatar-name">${esc(p.name || 'You')}</span></div>`;
    },
  },
  {
    title: "You're all set.",
    body: '<p>Have fun.</p>',
    stage: (el) => { el.innerHTML = `<div class="ob-hero">${cometSVG({ size: 96 })}</div>`; },
  },
];

let running = null;

export function startOnboarding({ onDone } = {}) {
  if (running) return;
  closePopover();
  const panel = sidebarMode('onboarding');
  const stage = h('div', { class: 'ob-stage', 'aria-hidden': 'true' });
  document.getElementById('canvas').append(stage);
  let index = 0;
  running = true;

  function finish() {
    setPref('onboarded', true);
    ensureProfile();
    stage.remove();
    panel.replaceChildren();
    sidebarMode('normal');
    running = null;
    document.querySelector('.sb-brand')?.focus();
    onDone?.();
  }

  function render(focusTarget = 'next') {
    const step = STEPS[index];
    const last = index === STEPS.length - 1;
    const body = typeof step.body === 'function' ? step.body() : step.body;
    panel.innerHTML = `<div class="ob">
      <div class="ob-top">
        <span class="ob-brand">${cometSVG({ size: 22 })}</span>
        ${last ? '' : '<button class="text-btn" type="button" data-ob="skip">Skip</button>'}
      </div>
      <div class="ob-body">
        ${step.extra ? step.extra() : ''}
        <section class="ob-card" aria-labelledby="ob-title">
          <h2 id="ob-title" tabindex="-1">${step.title}</h2>
          ${body}
        </section>
      </div>
      <div class="ob-foot">
        <div class="ob-dots" role="img" aria-label="Step ${index + 1} of ${STEPS.length}">
          ${STEPS.map((_, i) => `<span class="${i === index ? 'on' : ''}"></span>`).join('')}
        </div>
        <div class="ob-nav">
          ${index > 0 ? '<button class="btn" type="button" data-ob="back">Back</button>' : ''}
          <button class="btn btn-primary" type="button" data-ob="next">${last ? 'Finish' : 'Next'}</button>
        </div>
      </div>
    </div>`;
    stage.className = 'ob-stage';
    stage.replaceChildren();
    step.stage(stage);
    const target = focusTarget === 'title' ? panel.querySelector('#ob-title') : panel.querySelector(`[data-ob="${focusTarget}"]`);
    (target || panel.querySelector('[data-ob="next"]')).focus();
  }

  function go(delta) {
    index = Math.max(0, Math.min(STEPS.length - 1, index + delta));
    render(delta < 0 && index === 0 ? 'next' : delta < 0 ? 'back' : 'next');
  }

  panel.onclick = (e) => {
    const act = e.target.closest('[data-ob]')?.dataset.ob;
    if (act === 'next') { if (index === STEPS.length - 1) finish(); else go(1); }
    else if (act === 'back') go(-1);
    else if (act === 'skip') finish();
  };
  // Name and avatar changes save immediately and refresh the canvas preview.
  panel.oninput = (e) => {
    if (e.target.id !== 'ob-name') return;
    updateProfile({ name: e.target.value.slice(0, 24) });
    refreshAvatars();
  };
  panel.onchange = (e) => {
    const { name, value } = e.target;
    const avatar = getProfile().avatar;
    if (name === 'ob-bg') updateProfile({ avatar: { ...avatar, bg: value } });
    else if (name === 'ob-symbol') updateProfile({ avatar: { ...avatar, symbol: value } });
    else return;
    refreshAvatars();
  };

  // Update the avatar previews in place, so the step's entrance animation does not replay.
  function refreshAvatars() {
    const p = getProfile();
    const preview = stage.querySelector('.ob-avatar');
    if (preview) {
      preview.innerHTML = `${avatarSVG(p.avatar, { size: 120, name: p.name })}<span class="ob-avatar-name">${esc(p.name || 'You')}</span>`;
    }
    panel.querySelectorAll('.symbol input').forEach((input) => {
      input.nextElementSibling.innerHTML = avatarSVG({ bg: p.avatar.bg, symbol: input.value }, { size: 28, name: p.name });
    });
  }

  render('title');
}
