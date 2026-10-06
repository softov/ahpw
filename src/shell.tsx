import type { ReactElement } from 'react';
import type { Disposable, Scena } from '@softov/scena/types';
import { combineDisposables } from '@softov/scena';
import { registerThemeController } from '@softov/scena/styles';
import { registerCommands } from './commands/index.js';
import { registerConnection } from './connection/index.js';
import { registerSessions } from './sessions/index.js';
import { registerAutomations } from './automations/index.js';
import { registerHost } from './host/index.js';
import { registerView } from './view/index.js';
import { registerFiles } from './files/index.js';
import { registerChanges } from './changes/index.js';
import { registerThemes } from './view/themes.js';
import { attachKeys } from './view/keys.js';
import Palette, { PALETTE_OPEN, PALETTE_SLOT } from './view/Palette.js';
import { hideOverlaidSidebar } from './sessions/index.js';
import type { BindingPath } from '@softov/scena/types';
import type { ModusClass } from '@softov/scena';

/** The display size class the modus backend publishes. */
const MODUS_CLASS = '$/modus/class' as BindingPath;
import { THEME_ID_KEY, THEME_MODE_KEY } from './theme-keys.js';

function AppTitle({ text }: { text?: string }): ReactElement {
  return <span className="web-title">{text ?? 'ahpd'}</span>;
}

/** Runs `then` once with the display size class, as soon as it is known. */
function onceKnown(scena: Scena, then: (modus: ModusClass) => void): Disposable {
  const now = scena.store.get<ModusClass>(MODUS_CLASS);
  if (now !== undefined) {
    then(now);
    return { dispose: () => undefined };
  }
  const sub = scena.store.subscribe(MODUS_CLASS, () => {
    const known = scena.store.get<ModusClass>(MODUS_CLASS);
    if (known === undefined) return;
    sub.dispose();
    then(known);
  });
  return sub;
}

/** Everything that exists while somebody is signed in. */
export function registerShell(scena: Scena): Disposable {
  // Before the controller, so a saved theme is one it knows.
  registerThemes();
  return combineDisposables(
    registerThemeController(scena, { idKey: THEME_ID_KEY, modeKey: THEME_MODE_KEY }),

    scena.commands.register({
      id: 'sidebar.activate',
      title: 'Activate sidebar section',
      run: (ctx, args) => {
        const section = (args as { section?: string } | undefined)?.section;
        if (!section) return;
        const current = ctx.scena.layout.get().surfaces['sidebar:left'];
        ctx.scena.layout.setSurface('sidebar:left', { ...current, section, visible: true });
      },
    }),
    scena.commands.register({
      id: 'sidebar.toggleLeft',
      title: 'Toggle left sidebar',
      category: 'View',
      slots: [PALETTE_SLOT],
      keys: 'ctrl+b',
      run: (ctx) => {
        const current = ctx.scena.layout.get().surfaces['sidebar:left'];
        ctx.scena.layout.setSurface('sidebar:left', { ...current, visible: !(current?.visible ?? true) });
      },
    }),
    scena.commands.register({
      id: 'sidebar.toggleRight',
      title: 'Toggle right sidebar',
      category: 'View',
      slots: [PALETTE_SLOT],
      keys: 'ctrl+alt+b',
      run: (ctx) => {
        const current = ctx.scena.layout.get().surfaces['sidebar:right'];
        ctx.scena.layout.setSurface('sidebar:right', { ...current, visible: !(current?.visible ?? false) });
      },
    }),
    scena.commands.register({
      id: 'ahp.palette',
      title: 'Command palette',
      keys: 'ctrl+p',
      run: (ctx) => ctx.store.set(PALETTE_OPEN, ctx.store.get<boolean>(PALETTE_OPEN) !== true),
    }),
    attachKeys(scena),
    // The right sidebar opens beside the page; where it would cover it, it starts closed.
    onceKnown(scena, (modus) => hideOverlaidSidebar(scena, modus, 'sidebar:right')),
    scena.components.register({
      component: 'Palette',
      category: 'inline',
      renderer: { kind: 'react', load: async () => ({ default: Palette as unknown }) },
    }),
    scena.surfaces.mount({
      surface: 'titlebar',
      key: 'chrome:palette',
      resource: { component: 'Palette', slot: 'center' },
    }),

    scena.components.register({
      component: 'AppTitle',
      category: 'inline',
      renderer: { kind: 'react', load: async () => ({ default: AppTitle as unknown }) },
    }),
    scena.surfaces.mount({
      surface: 'titlebar',
      key: 'chrome:title',
      resource: { component: 'AppTitle', slot: 'left', text: 'ahpd' },
    }),
    registerView(scena),
    scena.surfaces.mount({
      surface: 'titlebar',
      key: 'chrome:theme-mode',
      resource: { component: 'ThemeModeToggle', slot: 'right' },
    }),
    scena.surfaces.mount({
      surface: 'titlebar',
      key: 'chrome:sign-out',
      resource: { component: 'ButtonBar', slot: 'right', label: 'Sign out', command: 'sigillum.signout' },
    }),
    scena.surfaces.mount({
      surface: 'statusbar',
      key: 'chrome:toggle-left',
      resource: { component: 'ButtonBar', icon: '\u{25E7}\u{FE0E}', title: 'Toggle left sidebar (Ctrl+B)', command: 'sidebar.toggleLeft' },
    }),
    scena.surfaces.mount({
      surface: 'statusbar',
      key: 'chrome:toggle-right',
      resource: { component: 'ButtonBar', slot: 'right', icon: '\u{25E8}\u{FE0E}', title: 'Toggle right sidebar (Ctrl+Alt+B)', command: 'sidebar.toggleRight' },
    }),

    registerConnection(scena),
    registerSessions(scena),
    registerChanges(scena),
    registerAutomations(scena),
    registerHost(scena),
    registerFiles(scena),
    registerCommands(scena),
  );
}
