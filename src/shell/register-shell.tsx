import type { ReactElement } from 'react';
import type { Disposable, Scena } from '@softov/scena/types';
import { combineDisposables, translate } from '@softov/scena';
import { bound } from '../i18n/locales.js';
import { registerThemeController } from '@softov/scena/styles';
// ahpd's admin, drawn from /api/cli-manifest; off while ahpw is AHP only.
// import { registerCommands } from '../resources/commands/index.js';
import { registerConnection } from '../bridges/index.js';
import { SESSIONS_SECTION, registerSessions } from '../resources/sessions/index.js';
import { AGENTS_SECTION, registerAgents } from '../resources/agents/index.js';
import { AUTOMATIONS_SECTION, registerAutomations } from '../resources/automations/index.js';
import { FOLDERS_SECTION, registerFolders } from '../resources/folders/index.js';
import { AHP_SESSIONS_UNREAD, AHP_SESSIONS_WORKING } from '../bridges/data.js';
import { EMOJIcon } from '../resources/emojis.js';
import { registerHost } from '../resources/host/index.js';
import { registerView } from './view/index.js';
import { registerFiles } from '../resources/files/index.js';
import { registerChanges } from '../resources/changes/index.js';
import { registerNotifications } from './notify/index.js';
import { registerPanel, registerPanelHide } from './panel/index.js';
import { registerTerminals } from '../resources/terminals/index.js';
import { registerBuiltinThemes } from '@softov/scena/themes';
import { attachKeys } from './view/keys.js';
import Palette, { PALETTE_OPEN, PALETTE_SLOT } from './view/Palette.js';
import { hideOverlaidSidebar } from '../resources/sessions/index.js';
import type { BindingPath } from '@softov/scena/types';
import type { ModusClass } from '@softov/scena';

/** The display size class the modus backend publishes. */
const MODUS_CLASS = '$/modus/class' as BindingPath;
import { THEME_ID_KEY, THEME_MODE_KEY } from '../lib/theme-keys.js';
import { embedder } from './embed/index.js';

function AppTitle({ text }: { text?: string }): ReactElement {
  return <span className="web-title">{text ?? 'ahpw'}</span>;
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
  registerBuiltinThemes();
  // A first visit shows the sessions.
  const left = scena.layout.get().surfaces['sidebar:left'];
  if (left?.section === undefined) scena.layout.setSurface('sidebar:left', { ...left, section: SESSIONS_SECTION });
  // The right sidebar shows its panes as tabs; a layout saved before it did kept them stacked.
  const right = scena.layout.get().surfaces['sidebar:right'];
  if (right?.layout === 'stack') scena.layout.setSurface('sidebar:right', { ...right, layout: 'tab' });
  const embedded = embedder;
  const controls = embedder?.window;
  return combineDisposables(
    // First, so anything registered after it can say something.
    registerNotifications(scena),
    registerThemeController(scena, { idKey: THEME_ID_KEY, modeKey: THEME_MODE_KEY }),

    scena.commands.register({
      id: 'sidebar.activate',
      title: () => translate('shell/commands/activateSection'),
      run: (ctx, args) => {
        const section = (args as { section?: string } | undefined)?.section;
        if (!section) return;
        const current = ctx.scena.layout.get().surfaces['sidebar:left'];
        ctx.scena.layout.setSurface('sidebar:left', { ...current, section, visible: true });
      },
    }),
    scena.commands.register({
      id: 'sidebar.toggleLeft',
      title: () => translate('shell/commands/toggleLeft'),
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
      title: () => translate('shell/commands/toggleRight'),
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
      title: () => translate('shell/commands/palette'),
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
      resource: { component: 'AppTitle', slot: 'left', text: 'ahpw' },
    }),
    registerView(scena),
    scena.surfaces.mount({
      surface: 'titlebar',
      key: 'chrome:theme-mode',
      resource: { component: 'ThemeModeToggle', slot: 'right' },
    }),
    scena.surfaces.mount({
      surface: 'titlebar',
      key: 'chrome:locale',
      resource: { component: 'LocaleToggle', slot: 'right' },
    }),
    // In an embedder, the embedder holds the token, so there is nothing to sign out of.
    ...(embedded !== undefined
      ? []
      : [
          scena.surfaces.mount({
            surface: 'titlebar',
            key: 'chrome:sign-out',
            resource: { component: 'ButtonBar', slot: 'right', label: bound('shell/signOut'), command: 'sigillum.signout' },
          }),
        ]),
    // The layout toggles last, at the title bar's far end: left sidebar, panel, right sidebar.
    scena.surfaces.mount({
      surface: 'titlebar',
      key: 'chrome:toggle-left',
      resource: { component: 'ButtonBar', slot: 'right', className: 'web-layout-toggle', icon: EMOJIcon.panelLeft, title: bound('shell/toggleLeft'), command: 'sidebar.toggleLeft', active: { path: '$/layout/surfaces/sidebar:left/visible' } },
    }),
    scena.surfaces.mount({
      surface: 'titlebar',
      key: 'chrome:toggle-panel',
      resource: { component: 'ButtonBar', slot: 'right', className: 'web-layout-toggle', icon: EMOJIcon.panelBottom, title: bound('shell/togglePanel'), command: 'panel.toggle', active: { path: '$/layout/surfaces/panel:bottom/visible' } },
    }),
    scena.surfaces.mount({
      surface: 'titlebar',
      key: 'chrome:toggle-right',
      resource: { component: 'ButtonBar', slot: 'right', className: 'web-layout-toggle', icon: EMOJIcon.panelRight, title: bound('shell/toggleRight'), command: 'sidebar.toggleRight', active: { path: '$/layout/surfaces/sidebar:right/visible' } },
    }),
    // In an embedder: the host switcher after the title.
    ...(embedded === undefined
      ? []
      : [
          scena.components.register({
            component: 'EmbedHostSwitcher',
            category: 'inline',
            renderer: {
              kind: 'react',
              load: async () => {
                const { default: HostSwitcher } = await import('./embed/HostSwitcher.js');
                return { default: (() => <HostSwitcher embedder={embedded} />) as unknown };
              },
            },
          }),
          scena.surfaces.mount({
            surface: 'titlebar',
            key: 'embed:host',
            resource: { component: 'EmbedHostSwitcher', slot: 'left' },
          }),
        ]),
    // When ahpw draws the window's frame: its own buttons, last.
    ...(controls === undefined
      ? []
      : [
          scena.components.register({
            component: 'EmbedWindowControls',
            category: 'inline',
            renderer: {
              kind: 'react',
              load: async () => {
                const { default: WindowControls } = await import('./embed/WindowControls.js');
                return { default: (() => <WindowControls controls={controls} />) as unknown };
              },
            },
          }),
          scena.surfaces.mount({
            surface: 'titlebar',
            key: 'embed:window-controls',
            resource: { component: 'EmbedWindowControls', slot: 'right' },
          }),
        ]),

    // The activity bar, in this order: mount order is the rail's order within each end.
    scena.surfaces.mount({
      surface: 'activitybar',
      key: 'sessions:nav',
      resource: {
        component: 'ActivityBarItem',
        icon: EMOJIcon.sessions,
        label: bound('shell/nav/sessions'),
        section: SESSIONS_SECTION,
        badge: { path: AHP_SESSIONS_UNREAD },
        badgeTone: 'muted',
        badgeLabel: bound('shell/nav/unread'),
        secondBadge: { path: AHP_SESSIONS_WORKING },
        secondBadgeTone: 'info',
        secondBadgeLabel: bound('shell/nav/working'),
      },
    }),
    scena.surfaces.mount({
      surface: 'activitybar',
      key: 'folders:nav',
      resource: { component: 'ActivityBarItem', icon: EMOJIcon.folder, label: bound('shell/nav/explorer'), section: FOLDERS_SECTION },
    }),
    scena.surfaces.mount({
      surface: 'activitybar',
      key: 'automations:nav',
      resource: { component: 'ActivityBarItem', icon: EMOJIcon.automations, label: bound('shell/nav/automations'), section: AUTOMATIONS_SECTION },
    }),
    scena.surfaces.mount({
      surface: 'activitybar',
      key: 'host:info:nav',
      resource: { component: 'ActivityBarItem', icon: EMOJIcon.host, label: bound('shell/nav/host'), pos: 'bottom', command: 'ahp.openHostInfo' },
    }),
    scena.surfaces.mount({
      surface: 'activitybar',
      key: 'agents:nav',
      resource: { component: 'ActivityBarItem', icon: EMOJIcon.agents, label: bound('shell/nav/agents'), pos: 'bottom', section: AGENTS_SECTION },
    }),
    scena.surfaces.mount({
      surface: 'activitybar',
      key: 'host:settings:nav',
      resource: { component: 'ActivityBarItem', icon: EMOJIcon.settings, label: bound('shell/nav/settings'), pos: 'bottom', command: 'ahp.openSettings' },
    }),

    registerConnection(scena),
    registerSessions(scena),
    registerAgents(scena),
    registerChanges(scena),
    registerAutomations(scena),
    registerFolders(scena),
    registerHost(scena),
    registerFiles(scena),
    registerPanel(scena),
    registerTerminals(scena),
    registerPanelHide(scena),
    // registerCommands(scena),
  );
}
