import type { Disposable, Scena } from '@softov/scena/types';

/** Elements where a bare key is typing, not a shortcut. */
const TYPING_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

function isTyping(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement | null;
  if (target === null) return false;
  return target.isContentEditable || TYPING_TAGS.has(target.tagName);
}

/**
 * Runs the command bound to a key. scena keeps the bindings a command's `keys`
 * declare but does not listen to the window; this does. A key with Ctrl, Alt
 * or Meta is a shortcut even while typing; a bare key is not.
 */
export function attachKeys(scena: Scena): Disposable {
  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Control' || event.key === 'Shift' || event.key === 'Alt' || event.key === 'Meta') return;
    if (isTyping(event) && !(event.ctrlKey || event.metaKey || event.altKey)) return;
    const resolution = scena.keybindings.resolve({
      key: event.key,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
    });
    if (resolution.kind === 'fire') {
      event.preventDefault();
      void scena.commands.executeFrom('keybinding', resolution.commandId, resolution.args?.[0]);
    } else if (resolution.kind === 'chord-pending') {
      event.preventDefault();
    }
  };
  window.addEventListener('keydown', onKeyDown);
  return { dispose: () => window.removeEventListener('keydown', onKeyDown) };
}
