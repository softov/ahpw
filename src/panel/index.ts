import type { ContextSnapshot, Disposable, MountDisplay, Scena } from '@softov/scena/types';
import { combineDisposables } from '@softov/scena';
import { clearLog } from '../log/log.js';
import { PALETTE_SLOT } from '../view/Palette.js';
import { EMOJIcon } from '../emojis.js';

/** The surface under the page: the log first, then the terminals. */
export const PANEL = 'panel:bottom';

/** The log tab's key; pinned, so it stays first. */
const LOG_KEY = 'panel:log';

/** The command slot of a tab strip's own buttons. */
export const STRIP_SLOT = 'surface/title';

/** Whether a strip button belongs to this panel: on the panel's strip, and anywhere a strip does not ask. */
export const onPanel = (ctx: ContextSnapshot): boolean => (ctx['$/surface/name'] ?? PANEL) === PANEL;

/** Whether a strip button belongs to the panel's active tab: on the panel, with a tab of this component active. Where no strip asks, as in the palette, it does. */
export const onPanelTab = (component: string) => (ctx: ContextSnapshot): boolean =>
  !('$/surface/name' in ctx) || (onPanel(ctx) && ctx['$/tab/component'] === component);

/** Show or hide the panel. */
export function showPanel(scena: Scena, visible = true): void {
  const current = scena.layout.get().surfaces[PANEL];
  scena.layout.setSurface(PANEL, { ...current, visible });
}

/** Draw the panel's strip again, for a strip button whose `when` reads the store: the strip redraws only on a layout change. */
export function redrawPanel(scena: Scena): void {
  scena.layout.setSurface(PANEL, {}, { transient: true });
}

/** Open the log tab when it is not open, pinned so it stays the first tab. */
function ensureLog(scena: Scena): void {
  if (scena.surfaces.listAt(PANEL).some((mount) => mount.key === LOG_KEY)) return;
  scena.surfaces.open({ surface: PANEL, key: LOG_KEY, resource: { component: 'LogPage' }, props: { title: 'Log', icon: EMOJIcon.log } });
  const current = scena.layout.get().surfaces[PANEL];
  const pinned = current?.split?.pinned ?? [];
  if (!pinned.includes(LOG_KEY)) scena.layout.setSurface(PANEL, { ...current, split: { ...(current?.split ?? {}), pinned: [LOG_KEY, ...pinned] } });
}

/**
 * Open a tab in the panel, after the log, and show the panel. A tab opened in
 * the background leaves the active tab and the panel's visibility as they were.
 */
export function openInPanel(
  scena: Scena,
  spec: { key: string; resource: { component: string; [prop: string]: unknown }; props?: MountDisplay },
  opts: { background?: boolean } = {},
): void {
  ensureLog(scena);
  const before = scena.layout.get().surfaces[PANEL]?.activeContainerKey;
  scena.surfaces.open({ ...spec, surface: PANEL });
  if (opts.background !== true) {
    showPanel(scena);
    return;
  }
  const current = scena.layout.get().surfaces[PANEL];
  if (before !== undefined && before !== spec.key) scena.layout.setSurface(PANEL, { ...current, activeContainerKey: before });
}

/** The bottom panel: shown and hidden from the title bar or a key, with the log as its first tab. */
export function registerPanel(scena: Scena): Disposable {
  // A panel the saved layout shows opens with its log.
  if (scena.layout.get().surfaces[PANEL]?.visible === true) ensureLog(scena);
  return combineDisposables(
    scena.components.register({
      component: 'LogPage',
      category: 'page',
      renderer: { kind: 'react', load: () => import('../log/LogPage.js') },
    }),
    scena.commands.register({
      id: 'panel.toggle',
      title: 'Toggle panel',
      category: 'View',
      slots: [PALETTE_SLOT],
      keys: ['ctrl+`', 'ctrl+j'],
      run: () => {
        const visible = scena.layout.get().surfaces[PANEL]?.visible ?? false;
        if (!visible) ensureLog(scena);
        showPanel(scena, !visible);
      },
    }),
    scena.commands.register({
      id: 'panel.showLog',
      title: 'Show log',
      category: 'View',
      slots: [PALETTE_SLOT],
      run: () => {
        ensureLog(scena);
        scena.surfaces.focus(LOG_KEY);
        showPanel(scena);
      },
    }),
    scena.commands.register({
      id: 'log.clear',
      title: 'Clear log',
      category: 'View',
      icon: EMOJIcon.clear,
      slots: [PALETTE_SLOT, STRIP_SLOT],
      when: onPanelTab('LogPage'),
      run: clearLog,
    }),
  );
}

/** The panel strip's hide button; registered after every other strip button, so it ends the strip. */
export function registerPanelHide(scena: Scena): Disposable {
  return scena.commands.register({
    id: 'panel.hide',
    title: 'Hide panel',
    icon: EMOJIcon.close,
    slots: [STRIP_SLOT],
    when: onPanel,
    run: () => showPanel(scena, false),
  });
}
