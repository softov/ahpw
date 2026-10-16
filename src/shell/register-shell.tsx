import type { ReactElement } from 'react';
import type { Disposable, Scena } from '@softov/scena/types';
import { combineDisposables, subscribeI18n, translate } from '@softov/scena';
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
import { registerShellCommands } from './commands.js';
import { registerLayoutMenu } from './layout-menu.js';
import { MANAGE_SLOT, registerManage } from './manage.js';
import type { BindingPath } from '@softov/scena/types';
import { THEME_ID_KEY, THEME_MODE_KEY } from '../lib/theme-keys.js';
import { embedder } from './embed/index.js';

function AppTitle({ text }: { text?: string }): ReactElement {
  return <span className="web-title">{text ?? 'ahpw'}</span>;
}

/** What an activity item passes to `sidebar.activate`: pressed again, it closes the sidebar. */
const TOGGLE = { toggle: true };

/** The left sidebar's active section, as the layout mirrors it into the store. */
const SECTION = '$/layout/surfaces/sidebar:left/section' as BindingPath;

/**
 * A section that stacks its panes, and the title strip over them; every other
 * section shows one page under its own header. Ported from web-next's
 * register-shell (SECTION_SHELL): the explorer is Open Editors over the folders.
 */
const SECTION_SHELL: Record<string, { layout: 'stack'; container: { title: string; icon: string } }> = {
  [FOLDERS_SECTION]: { layout: 'stack', container: { title: 'folders/explorer/title', icon: EMOJIcon.folder } },
};

/** Lays the left sidebar out for its section, with the strip's title in the chosen language. */
function applySidebarShell(scena: Scena): void {
  const section = scena.store.get<string>(SECTION) ?? '';
  const shell = SECTION_SHELL[section];
  const current = scena.layout.get().surfaces['sidebar:left'];
  scena.layout.setSurface('sidebar:left', {
    ...current,
    layout: shell?.layout ?? 'single',
    ...(shell === undefined ? {} : { stack: { ...current?.stack, container: { ...shell.container, title: translate(shell.container.title) } } }),
  });
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
  applySidebarShell(scena);
  const embedded = embedder;
  const controls = embedder?.window;
  return combineDisposables(
    scena.store.subscribe(SECTION, () => applySidebarShell(scena)),
    { dispose: subscribeI18n(() => applySidebarShell(scena)) },
    // First, so anything registered after it can say something.
    registerNotifications(scena),
    registerThemeController(scena, { idKey: THEME_ID_KEY, modeKey: THEME_MODE_KEY }),

    registerShellCommands(scena),
    registerLayoutMenu(scena),
    registerManage(scena, embedded !== undefined),
    attachKeys(scena),
    scena.components.register({
      component: 'CommandPalette',
      category: 'chrome',
      renderer: { kind: 'react', load: () => import('./CommandPalette.js') },
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
    // The title bar's far end, in this order: light or dark, the layout menu, then left sidebar, panel, right sidebar.
    scena.surfaces.mount({
      surface: 'titlebar',
      key: 'chrome:theme-mode',
      resource: { component: 'ThemeModeToggle', slot: 'right' },
    }),
    scena.surfaces.mount({
      surface: 'titlebar',
      key: 'chrome:layout',
      resource: { component: 'ButtonBar', slot: 'right', icon: EMOJIcon.layoutGroups, title: bound('shell/layout/title'), command: 'workbench.customizeLayout' },
    }),
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
        args: TOGGLE,
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
      resource: { component: 'ActivityBarItem', icon: EMOJIcon.folder, label: bound('shell/nav/explorer'), section: FOLDERS_SECTION, args: TOGGLE },
    }),
    scena.surfaces.mount({
      surface: 'activitybar',
      key: 'automations:nav',
      resource: { component: 'ActivityBarItem', icon: EMOJIcon.automations, label: bound('shell/nav/automations'), section: AUTOMATIONS_SECTION, args: TOGGLE },
    }),
    scena.surfaces.mount({
      surface: 'activitybar',
      key: 'host:info:nav',
      resource: { component: 'ActivityBarItem', icon: EMOJIcon.host, label: bound('shell/nav/host'), pos: 'bottom', command: 'ahp.openHostInfo' },
    }),
    scena.surfaces.mount({
      surface: 'activitybar',
      key: 'agents:nav',
      resource: { component: 'ActivityBarItem', icon: EMOJIcon.agents, label: bound('shell/nav/agents'), pos: 'bottom', section: AGENTS_SECTION, args: TOGGLE },
    }),
    scena.surfaces.mount({
      surface: 'activitybar',
      key: 'manage:nav',
      // A menu, not a page: language, layout, theme, settings and sign out (see manage.ts).
      resource: { component: 'ActivityBarItem', icon: EMOJIcon.settings, label: bound('shell/manage/title'), pos: 'bottom', menu: MANAGE_SLOT },
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
