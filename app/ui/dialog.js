// Modal dialogs on top of the native <dialog> element (built-in focus trap and Esc handling).

import { h, uid } from '../dom.js';
import { icon } from '../icons.js';

/**
 * Open a modal. actions: [{ label, primary, danger, autofocus, onClick(close) }].
 * Returns { el, body, footer, close }.
 */
export function openDialog({ title, body, actions = [], className = '', onClose } = {}) {
  const previous = document.activeElement;
  const titleId = uid('dlg-title');
  const content = h('div', { class: 'dialog-body' });
  if (body) content.append(body);
  const footer = h('div', { class: 'dialog-footer' });

  const dlg = h('dialog', { class: `dialog ${className}`, 'aria-labelledby': titleId },
    h('div', { class: 'dialog-inner' },
      h('header', { class: 'dialog-header' },
        h('h2', { id: titleId }, title),
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Close', html: icon('close'), onclick: () => close() })),
      content,
      footer));

  const close = (value) => { if (dlg.open) dlg.close(value ?? ''); };

  function setActions(list) {
    footer.replaceChildren(...list.map((a) => h('button', {
      class: 'btn' + (a.primary ? ' btn-primary' : '') + (a.danger ? ' btn-danger' : ''),
      type: 'button', autofocus: a.autofocus || null,
      onclick: () => a.onClick?.(close),
    }, a.label)));
    footer.hidden = !list.length;
  }
  setActions(actions);

  // A click on the backdrop (the dialog element itself, outside .dialog-inner) closes it.
  dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });
  dlg.addEventListener('close', () => {
    dlg.remove();
    onClose?.(dlg.returnValue);
    if (previous?.isConnected) previous.focus();
  });

  document.body.append(dlg);
  dlg.showModal();
  return { el: dlg, body: content, footer, close, setActions };
}

/** Yes/no confirmation. Resolves true only when the confirm button is pressed. */
export function confirmDialog({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false }) {
  return new Promise((resolve) => {
    openDialog({
      title,
      className: 'dialog-confirm',
      body: h('p', { class: 'dialog-text' }, message),
      actions: [
        { label: cancelLabel, autofocus: true, onClick: (close) => close('cancel') },
        { label: confirmLabel, primary: true, danger, onClick: (close) => close('confirm') },
      ],
      onClose: (value) => resolve(value === 'confirm'),
    });
  });
}
