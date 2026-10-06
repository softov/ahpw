import type { ReactElement } from 'react';
import type { Disposable, Scena } from '@softov/scena/types';
import { combineDisposables } from '@softov/scena';
import { registerThemeController } from '@softov/scena/styles';
import { registerCommands } from './commands/index.js';
import { registerSessions } from './ahp/index.js';
import { THEME_ID_KEY, THEME_MODE_KEY } from './theme-keys.js';

function AppTitle({ text }: { text?: string }): ReactElement {
  return <span className="web-title">{text ?? 'ahpd'}</span>;
}

/** Everything that exists while somebody is signed in. */
export function registerShell(scena: Scena): Disposable {
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
      run: (ctx) => {
        const current = ctx.scena.layout.get().surfaces['sidebar:left'];
        ctx.scena.layout.setSurface('sidebar:left', { ...current, visible: !(current?.visible ?? true) });
      },
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
      resource: { component: 'ButtonBar', icon: '\u{25E7}\u{FE0E}', title: 'Toggle sidebar', command: 'sidebar.toggleLeft' },
    }),

    registerSessions(scena),
    registerCommands(scena),
  );
}
