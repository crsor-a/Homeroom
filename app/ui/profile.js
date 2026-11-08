// Profile: the avatar button (bottom-left of the sidebar) and its popover.

import { h, esc, formatPlaytime, formatDate } from '../dom.js';
import { icon } from '../icons.js';
import { get, set, getItem, setItem, wipe } from '../state.js';
import { totals } from '../actions.js';
import { openPopover } from './menu.js';
import { confirmDialog } from './dialog.js';
import { avatarSVG, AVATAR_COLORS, AVATAR_SYMBOLS, DEFAULT_AVATAR } from './avatar.js';

const NAME_MAX = 24;

export function getProfile() {
  return { name: '', avatar: DEFAULT_AVATAR, joinedAt: null, ...getItem('profile', 'me') };
}

export function updateProfile(patch) {
  setItem('profile', 'me', { ...getProfile(), ...patch });
}

/** Make sure a profile exists and has a join date. */
export function ensureProfile() {
  const p = getProfile();
  if (!p.joinedAt) updateProfile({ joinedAt: Date.now() });
}

/** The three save-status messages from CLAUDE.md section 10. */
export function saveStatus() {
  const info = get('storageInfo') || { mode: 'session', persisted: false };
  if (info.mode !== 'persistent') return { ok: false, text: 'Not saved, private window' };
  if (info.persisted) return { ok: true, text: 'Saved on this browser' };
  return { ok: false, text: 'Saved, but your browser may clear it' };
}

/** Radio groups for color and symbol; native radios give arrow-key navigation for free. */
export function avatarPickerHTML(avatar, name, { colors = Object.keys(AVATAR_COLORS), symbols = Object.keys(AVATAR_SYMBOLS), group = 'pf' } = {}) {
  const colorRadios = colors.map((c) => `<label class="swatch" title="${AVATAR_COLORS[c].label}">
      <input class="sr-only" type="radio" name="${group}-bg" value="${c}" ${avatar.bg === c ? 'checked' : ''}>
      <span style="background:${AVATAR_COLORS[c].bg}"></span><span class="sr-only">${AVATAR_COLORS[c].label}</span></label>`).join('');
  const symbolRadios = symbols.map((s) => `<label class="symbol" title="${AVATAR_SYMBOLS[s].label}">
      <input class="sr-only" type="radio" name="${group}-symbol" value="${s}" ${avatar.symbol === s ? 'checked' : ''}>
      <span>${avatarSVG({ bg: avatar.bg, symbol: s }, { size: 28, name })}</span><span class="sr-only">${AVATAR_SYMBOLS[s].label}</span></label>`).join('');
  return `<fieldset class="picker"><legend>Color</legend><div class="swatches">${colorRadios}</div></fieldset>
    <fieldset class="picker"><legend>Symbol</legend><div class="symbols">${symbolRadios}</div></fieldset>`;
}

function contentHTML() {
  const p = getProfile();
  const t = totals();
  const status = saveStatus();
  return `
    <div class="pf-head">
      <span class="pf-preview">${avatarSVG(p.avatar, { size: 52, name: p.name })}</span>
      <div class="pf-id">
        <label class="sr-only" for="pf-name">Name</label>
        <input id="pf-name" class="input pf-name" type="text" maxlength="${NAME_MAX}" placeholder="Add your name"
          value="${esc(p.name)}" autocomplete="off" spellcheck="false">
        <p class="pf-joined">First joined ${formatDate(p.joinedAt)}</p>
      </div>
    </div>
    <div class="pf-editor">${avatarPickerHTML(p.avatar, p.name)}</div>
    <dl class="pf-stats">
      <div><dt>Total playtime</dt><dd>${formatPlaytime(t.playMs)}</dd></div>
      <div><dt>Games played</dt><dd>${t.played}</dd></div>
      <div><dt>Most played</dt><dd>${t.mostPlayed ? esc(t.mostPlayed.title) : 'None yet'}</dd></div>
    </dl>
    <p class="pf-status ${status.ok ? 'is-ok' : 'is-warn'}">${icon(status.ok ? 'check' : 'alert', { size: 14 })}<span>${status.text}</span></p>
    <div class="pf-actions">
      <button class="menu-item" type="button" data-act="onboarding">${icon('refresh')}<span>Replay onboarding</span></button>
      <button class="menu-item is-danger" type="button" data-act="wipe">${icon('trash')}<span>Wipe Homeroom</span></button>
    </div>`;
}

function openProfile(anchor) {
  const body = h('div', { class: 'profile', html: contentHTML() });
  const pop = openPopover(anchor, body, { placement: 'top-start', label: 'Profile', className: 'profile-pop' });
  body.querySelector('#pf-name').focus();

  const refreshAvatars = () => {
    const p = getProfile();
    body.querySelector('.pf-preview').innerHTML = avatarSVG(p.avatar, { size: 52, name: p.name });
    body.querySelectorAll('.symbol input').forEach((input) => {
      input.nextElementSibling.innerHTML = avatarSVG({ bg: p.avatar.bg, symbol: input.value }, { size: 28, name: p.name });
    });
  };

  body.addEventListener('input', (e) => {
    if (e.target.id === 'pf-name') {
      updateProfile({ name: e.target.value.slice(0, NAME_MAX) });
      refreshAvatars();
    }
  });
  body.addEventListener('change', (e) => {
    const { name, value } = e.target;
    if (name === 'pf-bg') updateProfile({ avatar: { ...getProfile().avatar, bg: value } });
    if (name === 'pf-symbol') updateProfile({ avatar: { ...getProfile().avatar, symbol: value } });
    refreshAvatars();
  });
  body.addEventListener('click', async (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'onboarding') {
      pop.close(false);
      set('onboardingRequest', Date.now());
    } else if (act === 'wipe') {
      pop.close(false);
      const yes = await confirmDialog({
        title: 'Wipe Homeroom?',
        message: 'This deletes your pins, hidden games, recents, stats, saves and profile from this browser. It cannot be undone.',
        confirmLabel: 'Wipe everything',
        danger: true,
      });
      if (!yes) return;
      await wipe();
      location.hash = '#/';
      location.reload();
    }
  });
}

/** Render the avatar button into the sidebar's bottom slot (updates in place if it exists). */
export function renderAvatarButton(slot) {
  const p = getProfile();
  const label = p.name || 'Profile';
  let button = slot.querySelector('.avatar-btn');
  if (!button) {
    button = h('button', { class: 'avatar-btn', type: 'button', 'aria-haspopup': 'dialog', 'aria-expanded': 'false' });
    button.addEventListener('click', () => {
      if (button.getAttribute('aria-expanded') !== 'true') openProfile(button);
    });
    slot.replaceChildren(button);
  }
  button.setAttribute('aria-label', `Profile: ${label}`);
  button.innerHTML = `${avatarSVG(p.avatar, { size: 28, name: p.name })}<span class="name">${esc(label)}</span>`;
}
