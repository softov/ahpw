import type { ReactElement } from 'react';
import type { Disposable, Scena } from '@softov/scena/types';
import { combineDisposables, subscribeI18n, translate, type ModusClass } from '@softov/scena';
import { bound } from '../i18n/locales.js';
import { registerThemeController } from '@softov/scena/styles';
// ahpd's admin, drawn from /api/cli-manifest; off while ahpw is AHP only.
// import { registerCommands } from '../resources/commands/index.js';
import { registerConnection } from '../bridges/index.js';
import { registerHosts, sessionCountPaths } from '../bridges/hosts.js';
import { SESSIONS_SECTION, hideOverlaidSidebar, registerSessionFiles, registerSessions } from '../resources/sessions/index.js';
import { AGENTS_SECTION, registerAgents } from '../resources/agents/index.js';
import { AUTOMATIONS_SECTION, registerAutomations } from '../resources/automations/index.js';
import { COMPUTERS_SECTION, registerComputers } from '../resources/computers/index.js';
import { COMPUTERS_SERVED } from '../resources/computers/state.js';
import { BOTS_SECTION, registerBots } from '../resources/bots/index.js';
import { registerCanvases } from '../resources/canvases/index.js';
import { BOTS_SERVED } from '../resources/bots/state.js';
import { registerUsers, USERS_SECTION } from '../resources/users/index.js';
import { registerProfilePage } from '../resources/profile/index.js';
import { USERS_SERVED } from '../resources/users/state.js';
import { registerTeams, TEAMS_SECTION } from '../resources/teams/index.js';
import { TEAMS_SERVED } from '../resources/teams/state.js';
import { registerUsage, USAGE_SECTION } from '../resources/usage/index.js';
import { USAGE_SERVED } from '../resources/usage/state.js';
import { POLICIES_SECTION, registerPolicies } from '../resources/policies/index.js';
import { PLUGINS_SECTION, registerPlugins } from '../resources/plugins/index.js';
import { PLUGINS_SERVED } from '../resources/plugins/state.js';
import { CONNECTORS_SECTION, registerConnectors } from '../resources/connectors/index.js';
import { CONNECTORS_SERVED } from '../resources/connectors/state.js';
import { POLICIES_SERVED } from '../resources/policies/state.js';
import { FOLDERS_SECTION, registerFolders } from '../resources/folders/index.js';
import { ahpPaths, windowHost } from '../bridges/data.js';
import { EMOJIcon } from '../resources/emojis.js';
import { registerHost } from '../resources/host/index.js';
import { registerView } from './view/index.js';
import { registerProfile } from './ui-settings/profile.js';
import { registerFiles } from '../resources/files/index.js';
import { registerChanges } from '../resources/changes/index.js';
import { registerBrowser } from './browser/index.js';
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
import { AhpioMark } from './AhpioMark.js';

/** The title bar's brand: ahpio's mark, in the activity bar's column. */
function AppTitle(): ReactElement {
  return (
    <span className="web-title">
      <AhpioMark size={16} label="ahpio" />
    </span>
  );
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

/** The display size class the modus backend publishes, and whether each sidebar shows, as the layout mirrors it. */
const MODUS_CLASS = '$/modus/class' as BindingPath;
const LEFT_SHOWN = '$/layout/surfaces/sidebar:left/visible' as BindingPath;
const RIGHT_SHOWN = '$/layout/surfaces/sidebar:right/visible' as BindingPath;

/**
 * On a narrow screen both sidebars float over the page, and one over the other
 * hides both, so showing one puts the other away. Both shown at once, as a wide
 * screen's layout leaves them, keeps the left.
 */
function oneOverlaidSidebar(scena: Scena): Disposable {
  const shown = (surface: 'sidebar:left' | 'sidebar:right'): boolean => scena.layout.get().surfaces[surface]?.visible !== false;
  const keep = (surface: 'sidebar:left' | 'sidebar:right'): void => {
    const other = surface === 'sidebar:left' ? 'sidebar:right' : 'sidebar:left';
    if (shown(surface) && shown(other)) hideOverlaidSidebar(scena, scena.store.get<ModusClass>(MODUS_CLASS) ?? 'large', other);
  };
  keep('sidebar:left');
  return combineDisposables(
    scena.store.subscribe(LEFT_SHOWN, () => keep('sidebar:left')),
    scena.store.subscribe(RIGHT_SHOWN, () => keep('sidebar:right')),
    scena.store.subscribe(MODUS_CLASS, () => keep('sidebar:left')),
  );
}

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
    oneOverlaidSidebar(scena),
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
      resource: { component: 'AppTitle', slot: 'left' },
    }),
    registerView(scena),
    // After every owner of a UI setting: the theme, notifications, the view.
    registerProfile(scena, embedder?.profile),
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
        badge: { path: sessionCountPaths().unread },
        badgeTone: 'muted',
        badgeLabel: bound('shell/nav/unread'),
        secondBadge: { path: sessionCountPaths().working },
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
      key: 'agents:nav',
      resource: { component: 'ActivityBarItem', icon: EMOJIcon.agents, label: bound('shell/nav/agents'), pos: 'bottom', section: AGENTS_SECTION, args: TOGGLE },
    }),
    // Shown while a host serves ahpd's computer plugin.
    scena.surfaces.mount({
      surface: 'activitybar',
      key: 'computers:nav',
      when: `${COMPUTERS_SERVED} == true`,
      resource: { component: 'ActivityBarItem', icon: EMOJIcon.computers, label: bound('shell/nav/computers'), pos: 'bottom', section: COMPUTERS_SECTION, args: TOGGLE },
    }),
    // Shown while a host serves ahpd's bot plugin.
    scena.surfaces.mount({
      surface: 'activitybar',
      key: 'bots:nav',
      when: `${BOTS_SERVED} == true`,
      resource: { component: 'ActivityBarItem', icon: EMOJIcon.bots, label: bound('shell/nav/bots'), pos: 'bottom', section: BOTS_SECTION, args: TOGGLE },
    }),
    // Shown while a host lists its users.
    scena.surfaces.mount({
      surface: 'activitybar',
      key: 'users:nav',
      when: `${USERS_SERVED} == true`,
      resource: { component: 'ActivityBarItem', icon: EMOJIcon.users, label: bound('shell/nav/users'), pos: 'bottom', section: USERS_SECTION, args: TOGGLE },
    }),
    // Shown while a host lists its teams.
    scena.surfaces.mount({
      surface: 'activitybar',
      key: 'teams:nav',
      when: `${TEAMS_SERVED} == true`,
      resource: { component: 'ActivityBarItem', icon: EMOJIcon.teams, label: bound('shell/nav/teams'), pos: 'bottom', section: TEAMS_SECTION, args: TOGGLE },
    }),
    // Shown while a host keeps usage.
    scena.surfaces.mount({
      surface: 'activitybar',
      key: 'usage:nav',
      when: `${USAGE_SERVED} == true`,
      resource: { component: 'ActivityBarItem', icon: EMOJIcon.usage, label: bound('shell/nav/usage'), pos: 'bottom', section: USAGE_SECTION, args: TOGGLE },
    }),
    // Shown while a host lists its policies.
    scena.surfaces.mount({
      surface: 'activitybar',
      key: 'policies:nav',
      when: `${POLICIES_SERVED} == true`,
      resource: { component: 'ActivityBarItem', icon: EMOJIcon.policies, label: bound('shell/nav/policies'), pos: 'bottom', section: POLICIES_SECTION, args: TOGGLE },
    }),
    // Shown while a host lists its plugins to this reader, which takes config:read.
    scena.surfaces.mount({
      surface: 'activitybar',
      key: 'plugins:nav',
      when: `${PLUGINS_SERVED} == true`,
      resource: { component: 'ActivityBarItem', icon: EMOJIcon.hostPlugins, label: bound('shell/nav/plugins'), pos: 'bottom', section: PLUGINS_SECTION, args: TOGGLE },
    }),
    // Shown while a host lists connectors to this reader: every kind and connector with config:read, else their own.
    scena.surfaces.mount({
      surface: 'activitybar',
      key: 'connectors:nav',
      when: `${CONNECTORS_SERVED} == true`,
      resource: { component: 'ActivityBarItem', icon: EMOJIcon.connectors, label: bound('shell/nav/connectors'), pos: 'bottom', section: CONNECTORS_SECTION, args: TOGGLE },
    }),
    scena.surfaces.mount({
      surface: 'activitybar',
      key: 'manage:nav',
      // A menu, not a page: language, layout, theme, settings and sign out (see manage.ts).
      resource: { component: 'ActivityBarItem', icon: EMOJIcon.settings, label: bound('shell/manage/title'), pos: 'bottom', menu: MANAGE_SLOT },
    }),

    registerConnection(scena),
    registerHosts(scena),
    registerSessions(scena),
    registerAgents(scena),
    registerChanges(scena),
    registerBrowser(scena),
    registerSessionFiles(scena),
    registerAutomations(scena),
    registerComputers(scena),
    registerBots(scena),
    registerCanvases(scena),
    registerUsers(scena),
    registerProfilePage(scena),
    registerTeams(scena),
    registerUsage(scena),
    registerPolicies(scena),
    registerPlugins(scena),
    registerConnectors(scena),
    registerFolders(scena),
    registerHost(scena),
    registerFiles(scena),
    registerPanel(scena),
    registerTerminals(scena),
    registerPanelHide(scena),
    // registerCommands(scena),
  );
}
