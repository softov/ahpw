/**
 * The window's frame on the desk, which draws none of its own: the rounded
 * root (`desk.css`), squared while the window is maximized, and the title bar
 * as the place a drag moves the window and a double click maximizes it.
 */

import { windowControls } from '@ahpd/desk-client';

/** What in the title bar takes its own clicks instead of moving the window. */
const INTERACTIVE = 'button, input, select, textarea, a, [role="button"], [role="menu"], [role="menuitem"], [contenteditable="true"]';

/** True for a press on the title bar's empty space. */
function onBar(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return target.closest('[data-surface="titlebar"]') !== null && target.closest(INTERACTIVE) === null;
}

/** Starts the frame: called once, before the app renders, only on the desk. */
export function startFrame(): void {
  const html = document.documentElement;
  html.classList.add('is-desk');

  const sync = async () => {
    html.classList.toggle('is-maximized', await windowControls.isMaximized());
  };
  void sync();
  void windowControls.onResized(() => void sync());

  // As Tauri's own drag region: the second press of a double click maximizes, any other drags.
  document.addEventListener('mousedown', (event) => {
    if (event.button !== 0 || !onBar(event.target)) return;
    event.preventDefault();
    void (event.detail === 2 ? windowControls.toggleMaximize() : windowControls.startDragging());
  });
}
