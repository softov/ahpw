import type { BindingPath, Disposable, Scena } from '@softov/scena/types';
import { combineDisposables, translate, type ModusClass } from '@softov/scena';
import { PALETTE_SLOT } from '../../shell/CommandPalette.js';
import { hideOverlaidSidebar } from '../sessions/index.js';
import { ahpPaths, hostBridge } from '../../bridges/data.js';
import { HOST_FILTER_ACTION, shownHosts } from '../../bridges/hosts.js';
import type { Offers } from '../../bridges/offers.js';
import { trackServed } from '../../bridges/served.js';
import { registerChoice } from '../../shell/explorer/choice.js';
import { embedMode } from '../../shell/embed/index.js';
import { readLastHost, startHost } from '../sessions/last-host.js';
import { EMOJIcon } from '../emojis.js';
import { bound, english } from '../../i18n/locales.js';
import { CHOICE_KEYS, COMPUTER_FILTERS, COMPUTER_GROUPS } from './arrange.js';
import { COMPUTERS, COMPUTERS_SCHEME } from './machines.js';
import { ACTIVE_COMPUTER, COMPUTERS_FILTER, COMPUTERS_GROUP, COMPUTERS_SERVED } from './state.js';

/** The display size class the modus backend publishes. */
const MODUS_CLASS = '$/modus/class' as BindingPath;

/** The sidebar section the computers list shows in. */
export const COMPUTERS_SECTION = 'ahp:computers';

/** The menus of the list's Group and State buttons. */
const GROUP_SLOT = 'computers:group';
const FILTER_SLOT = 'computers:filter';

/** Arguments of the commands that open a computer. */
export interface ComputerArgs {
  host: string;
  id: string;
}

const serving = (offers: Offers | undefined): boolean => offers?.channels.includes(COMPUTERS_SCHEME) ?? false;

/** The computers list, a computer's page, and the form that makes one. */
export function registerComputers(scena: Scena): Disposable {
  return combineDisposables(
    trackServed(scena, COMPUTERS_SCHEME, COMPUTERS_SERVED),
    registerChoice(scena, { resource: 'computers', name: 'group', slot: GROUP_SLOT, path: COMPUTERS_GROUP, values: COMPUTER_GROUPS, usual: 'none', key: CHOICE_KEYS.group, when: (value) => value !== 'host' || embedMode() === 'multi' }),
    registerChoice(scena, { resource: 'computers', name: 'status', slot: FILTER_SLOT, path: COMPUTERS_FILTER, values: COMPUTER_FILTERS, usual: 'all', key: CHOICE_KEYS.filter }),
    scena.components.register({
      component: 'ComputerExplorer',
      category: 'page',
      renderer: { kind: 'react', load: () => import('./Explorer.js') },
      props: {
        title: { t: 'computers/explorer/title' },
        actions: [
          { command: 'ahp.newComputer', icon: '+', label: { t: 'computers/commands/new' } },
          { command: 'computers.reload', icon: EMOJIcon.reload, label: { t: 'common/reload' } },
          { command: 'computers.status', menu: FILTER_SLOT, icon: EMOJIcon.filter, label: { t: 'computers/explorer/status' }, active: `${COMPUTERS_FILTER} != null` },
          { command: 'computers.group', menu: GROUP_SLOT, icon: EMOJIcon.group, label: { t: 'computers/explorer/group' }, active: `${COMPUTERS_GROUP} != null` },
          HOST_FILTER_ACTION,
        ],
      },
    }),
    scena.commands.register({
      id: 'computers.reload',
      title: () => translate('common/reload'),
      run: (ctx) => Promise.all(shownHosts(ctx.store)
        .filter((host) => serving(ctx.store.get<Offers>(ahpPaths(host).offers)))
        .map((host) => hostBridge(host).refresh(COMPUTERS))),
    }),
    scena.components.register({
      component: 'ComputerPage',
      category: 'page',
      props: { icon: EMOJIcon.computers },
      renderer: { kind: 'react', load: () => import('./Page.js') },
    }),
    scena.components.register({
      component: 'NewComputerPage',
      category: 'page',
      props: { icon: EMOJIcon.computers },
      renderer: { kind: 'react', load: () => import('./New.js') },
    }),
    scena.commands.register({
      id: 'ahp.showComputers',
      title: () => translate('computers/commands/show'),
      keywords: [english('computers/commands/show')],
      category: 'Computers',
      slots: [PALETTE_SLOT],
      when: () => scena.store.get<boolean>(COMPUTERS_SERVED) === true,
      run: (ctx) => ctx.commands.execute('sidebar.activate', { section: COMPUTERS_SECTION }),
    }),
    scena.commands.register({
      id: 'ahp.newComputer',
      title: () => translate('computers/commands/new'),
      keywords: [english('computers/commands/new')],
      category: 'Computers',
      slots: [PALETTE_SLOT],
      when: () => scena.store.get<boolean>(COMPUTERS_SERVED) === true,
      run: (ctx, args) => {
        // The last host used, when it serves computers; the page lets a person change it.
        const given = (args as { host?: string } | undefined)?.host;
        const hosts = shownHosts(ctx.store).filter((host) => serving(ctx.store.get<Offers>(ahpPaths(host).offers)));
        const host = given ?? startHost(hosts, readLastHost());
        if (host === undefined) return;
        ctx.surfaces.open({ surface: 'main', key: 'computer:new', resource: { component: 'NewComputerPage', host }, props: { title: bound('computers/commands/new') } });
        hideOverlaidSidebar(ctx.scena, ctx.store.get<ModusClass>(MODUS_CLASS) ?? 'large');
      },
    }),
    scena.commands.register({
      id: 'ahp.openComputer',
      title: () => translate('computers/commands/open'),
      run: (ctx, args) => {
        const target = args as ComputerArgs | undefined;
        if (target?.id === undefined) return;
        ctx.store.set(ACTIVE_COMPUTER, { host: target.host, id: target.id });
        ctx.surfaces.open({
          surface: 'main',
          key: `computer:${target.host}:${target.id}`,
          // `machine`, not `id`: scena keeps `id` for itself.
          resource: { component: 'ComputerPage', host: target.host, machine: target.id },
          props: { title: target.id },
        });
        hideOverlaidSidebar(ctx.scena, ctx.store.get<ModusClass>(MODUS_CLASS) ?? 'large');
      },
    }),
    scena.surfaces.mount({
      surface: 'sidebar:left',
      key: 'computers:explorer',
      when: `$/layout/surfaces/sidebar:left/section == "${COMPUTERS_SECTION}"`,
      resource: { component: 'ComputerExplorer' },
    }),
  );
}

