import type { BindingPath, Disposable, Scena } from '@softov/scena/types';
import { PALETTE_SLOT } from '../../shell/CommandPalette.js';
import { combineDisposables, translate, type ModusClass } from '@softov/scena';
import { hideOverlaidSidebar } from '../sessions/index.js';
import { ACTIVE_AUTOMATION, AUTOMATIONS_FILTER, AUTOMATIONS_GROUP, AUTOMATIONS_SORT } from './state.js';
import { AUTO_FILTERS, AUTO_GROUPS, AUTO_SORTS, CHOICE_KEYS } from './arrange.js';
import { registerChoice } from '../../shell/explorer/choice.js';
import { titleOf } from './words.js';
import { ahpPaths, AUTOMATIONS, channelPath, hostBridge, windowHost } from '../../bridges/data.js';
import { everyHost, HOST_FILTER_ACTION, shownHosts } from '../../bridges/hosts.js';
import { readLastHost, startHost } from '../sessions/last-host.js';
import { embedMode } from '../../shell/embed/index.js';
import type { AutomationState } from '@microsoft/agent-host-protocol';
import { EMOJIcon } from '../emojis.js';
import { bound, english } from '../../i18n/locales.js';

/** The display size class the modus backend publishes. */
const MODUS_CLASS = '$/modus/class' as BindingPath;

/** Arguments of the commands that open an automation. */
export interface AutomationArgs {
  resource: string;
  /** The automation's host; the window's host by default. */
  host?: string;
}

/** The sidebar section the automations list shows in. */
export const AUTOMATIONS_SECTION = 'ahp:automations';

/** The menus of the list's Group, Sort and Status buttons. */
const GROUP_SLOT = 'automations:group';
const SORT_SLOT = 'automations:sort';
const FILTER_SLOT = 'automations:filter';

/** The automations list and an automation's page. */
export function registerAutomations(scena: Scena): Disposable {
  return combineDisposables(
    registerChoice(scena, { resource: 'automations', name: 'group', slot: GROUP_SLOT, path: AUTOMATIONS_GROUP, values: AUTO_GROUPS, usual: 'none', key: CHOICE_KEYS.group, when: (value) => value !== 'host' || embedMode() === 'multi' }),
    registerChoice(scena, { resource: 'automations', name: 'sort', slot: SORT_SLOT, path: AUTOMATIONS_SORT, values: AUTO_SORTS, usual: 'name', key: CHOICE_KEYS.sort }),
    registerChoice(scena, { resource: 'automations', name: 'status', slot: FILTER_SLOT, path: AUTOMATIONS_FILTER, values: AUTO_FILTERS, usual: 'all', key: CHOICE_KEYS.filter }),
    scena.components.register({
      component: 'AutomationExplorer',
      category: 'page',
      renderer: { kind: 'react', load: () => import('./Explorer.js') },
      // scena draws the section's header from these; New shows only where the host lets clients create.
      props: {
        title: { t: 'automations/explorer/title' },
        actions: [
          // With every host, the new automation's page says when its host cannot create one.
          { command: 'ahp.newAutomation', icon: '+', label: { t: 'automations/commands/new' }, ...(embedMode() === 'multi' ? {} : { when: `${ahpPaths(windowHost()).automationCaps}/create != null` }) },
          { command: 'automations.reload', icon: EMOJIcon.reload, label: { t: 'common/reload' } },
          { command: 'automations.status', menu: FILTER_SLOT, icon: EMOJIcon.filter, label: { t: 'automations/explorer/status' }, active: `${AUTOMATIONS_FILTER} != null` },
          { command: 'automations.group', menu: GROUP_SLOT, icon: EMOJIcon.group, label: { t: 'automations/explorer/group' }, active: `${AUTOMATIONS_GROUP} != null` },
          { command: 'automations.sort', menu: SORT_SLOT, icon: EMOJIcon.sort, label: { t: 'automations/explorer/sort' }, active: `${AUTOMATIONS_SORT} != null` },
          HOST_FILTER_ACTION,
        ],
      },
    }),
    scena.commands.register({
      id: 'automations.reload',
      title: () => translate('common/reload'),
      run: (ctx) => Promise.all(shownHosts(ctx.store).map((host) => hostBridge(host).refresh(AUTOMATIONS))),
    }),
    scena.components.register({
      component: 'AutomationPage',
      category: 'page',
      props: { icon: EMOJIcon.automations },
      renderer: { kind: 'react', load: () => import('./Page.js') },
    }),
    scena.components.register({
      component: 'AutomationEditPage',
      category: 'page',
      props: { icon: EMOJIcon.automations },
      renderer: { kind: 'react', load: () => import('./Edit.js') },
    }),
    scena.commands.register({
      id: 'ahp.newAutomation',
      title: () => translate('automations/commands/new'),
      keywords: [english('automations/commands/new')],
      category: 'Automations',
      slots: [PALETTE_SLOT],
      run: (ctx, args) => {
        // With every host, the last host used, which the page lets a person change.
        const given = (args as { host?: string } | undefined)?.host;
        const host = given ?? (embedMode() === 'multi' ? startHost(everyHost(ctx.store), readLastHost()) : windowHost());
        if (host === undefined) return;
        ctx.surfaces.open({ surface: 'main', key: 'automation:new', resource: { component: 'AutomationEditPage', host }, props: { title: bound('automations/commands/new') } });
        hideOverlaidSidebar(ctx.scena, ctx.store.get<ModusClass>(MODUS_CLASS) ?? 'large');
      },
    }),
    scena.commands.register({
      id: 'ahp.showAutomations',
      title: () => translate('automations/commands/show'),
      keywords: [english('automations/commands/show')],
      category: 'Automations',
      slots: [PALETTE_SLOT],
      run: (ctx) => ctx.commands.execute('sidebar.activate', { section: AUTOMATIONS_SECTION }),
    }),
    scena.commands.register({
      id: 'ahp.editAutomation',
      title: () => translate('automations/commands/edit'),
      run: (ctx, args) => {
        const target = args as AutomationArgs | undefined;
        if (target?.resource === undefined) return;
        const { resource, host = windowHost() } = target;
        const entry = ctx.store.get<AutomationState>(channelPath(host, AUTOMATIONS))?.entries.find((one) => one.resource === resource);
        ctx.surfaces.open({
          surface: 'main',
          key: `automation:edit:${host}:${resource}`,
          resource: { component: 'AutomationEditPage', host, resource },
          props: { title: entry === undefined ? bound('automations/commands/edit') : translate('automations/editTitle', { title: titleOf(entry) }) },
        });
        hideOverlaidSidebar(ctx.scena, ctx.store.get<ModusClass>(MODUS_CLASS) ?? 'large');
      },
    }),
    scena.commands.register({
      id: 'ahp.openAutomation',
      title: () => translate('automations/commands/open'),
      run: (ctx, args) => {
        const target = args as AutomationArgs | undefined;
        if (target?.resource === undefined) return;
        const { resource, host = windowHost() } = target;
        ctx.store.set(ACTIVE_AUTOMATION, { host, resource });
        const entry = ctx.store.get<AutomationState>(channelPath(host, AUTOMATIONS))?.entries.find((one) => one.resource === resource);
        ctx.surfaces.open({
          surface: 'main',
          key: `automation:${host}:${resource}`,
          resource: { component: 'AutomationPage', host, resource },
          props: { title: entry === undefined ? bound('automations/automation') : titleOf(entry) },
        });
        hideOverlaidSidebar(ctx.scena, ctx.store.get<ModusClass>(MODUS_CLASS) ?? 'large');
      },
    }),
    scena.surfaces.mount({
      surface: 'sidebar:left',
      key: 'automations:explorer',
      when: `$/layout/surfaces/sidebar:left/section == "${AUTOMATIONS_SECTION}"`,
      resource: { component: 'AutomationExplorer' },
    }),
  );
}
