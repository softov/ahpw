import type { BindingPath, Disposable, Scena } from '@softov/scena/types';
import { combineDisposables, translate, type ModusClass } from '@softov/scena';
import { PALETTE_SLOT } from '../../shell/CommandPalette.js';
import { hideOverlaidSidebar } from '../sessions/index.js';
import { ahpPaths, channelPath, hostBridge } from '../../bridges/data.js';
import { CONNECTORS, servesConnectors, type ConnectorRow } from '../../bridges/connectors.js';
import { HOST_FILTER_ACTION, shownHosts } from '../../bridges/hosts.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import type { PeopleState } from '../../bridges/people.js';
import { trackServed } from '../../bridges/served.js';
import { registerChoice } from '../../shell/explorer/choice.js';
import { readLastHost, startHost } from '../sessions/last-host.js';
import { EMOJIcon } from '../emojis.js';
import { bound, english } from '../../i18n/locales.js';
import { CONNECTOR_GROUPINGS } from './rows.js';
import { ACTIVE_CONNECTOR, connectorTab, CONNECTORS_GROUP, CONNECTORS_SERVED, GROUP_KEY, newConnectorTab } from './state.js';

/** The display size class the modus backend publishes. */
const MODUS_CLASS = '$/modus/class' as BindingPath;

/** The sidebar section the connectors list shows in. */
export const CONNECTORS_SECTION = 'ahp:connectors';

/** The menu of the list's Group button. */
const GROUP_SLOT = 'connectors:group';

/** Arguments of the commands about one connector. */
export interface ConnectorArgs {
  host?: string;
  id?: string;
  /** Its title, for a connector the channel has not brought yet. */
  title?: string;
}

/** The host's connectors: a list grouped by adapter, owner or state, a form that makes one, and a page that shows, changes and deletes each. */
export function registerConnectors(scena: Scena): Disposable {
  const offersOf = (host: string): Offers => scena.store.get<Offers>(ahpPaths(host).offers) ?? NO_OFFERS;
  const servingHosts = (): string[] => shownHosts(scena.store).filter((host) => servesConnectors(offersOf(host)));
  const served = (): boolean => scena.store.get<boolean>(CONNECTORS_SERVED) === true;
  const titleOf = (host: string, id: string): string => {
    const records = scena.store.get<PeopleState<ConnectorRow>>(channelPath(host, CONNECTORS.channel))?.records ?? [];
    const row = records.find((one) => one.id === id)?.record;
    return row?.title || id;
  };
  const show = (key: string, resource: Parameters<Scena['surfaces']['open']>[0]['resource'], title: string | ReturnType<typeof bound>): void => {
    scena.surfaces.open({ surface: 'main', key, resource, props: { title } });
    hideOverlaidSidebar(scena, scena.store.get<ModusClass>(MODUS_CLASS) ?? 'large');
  };

  return combineDisposables(
    trackServed(scena, CONNECTORS.scheme, CONNECTORS_SERVED),
    registerChoice(scena, { resource: 'connectors', name: 'group', slot: GROUP_SLOT, path: CONNECTORS_GROUP, values: CONNECTOR_GROUPINGS, usual: 'adapter', key: GROUP_KEY }),
    scena.components.register({
      component: 'ConnectorsExplorer',
      category: 'page',
      renderer: { kind: 'react', load: () => import('./Explorer.js') },
      props: {
        title: { t: 'connectors/explorer/title' },
        actions: [
          { command: 'ahp.newConnector', icon: '+', label: { t: 'connectors/commands/new' } },
          { command: 'connectors.reload', icon: EMOJIcon.reload, label: { t: 'common/reload' } },
          { command: 'connectors.group', menu: GROUP_SLOT, icon: EMOJIcon.group, label: { t: 'connectors/explorer/group' }, active: `${CONNECTORS_GROUP} != null` },
          HOST_FILTER_ACTION,
        ],
      },
    }),
    scena.components.register({ component: 'ConnectorPage', category: 'page', props: { icon: EMOJIcon.connectors }, renderer: { kind: 'react', load: () => import('./ConnectorPage.js') } }),
    scena.components.register({ component: 'NewConnectorPage', category: 'page', props: { icon: EMOJIcon.connectors }, renderer: { kind: 'react', load: () => import('./NewConnectorPage.js') } }),
    scena.commands.register({
      id: 'connectors.reload',
      title: () => translate('common/reload'),
      run: () => Promise.all(servingHosts().map((host) => hostBridge(host).refresh(CONNECTORS.channel))),
    }),
    scena.commands.register({
      id: 'ahp.showConnectors',
      title: () => translate('connectors/commands/show'),
      keywords: [english('connectors/commands/show')],
      category: 'Connectors',
      slots: [PALETTE_SLOT],
      when: served,
      run: (ctx) => ctx.commands.execute('sidebar.activate', { section: CONNECTORS_SECTION }),
    }),
    scena.commands.register({
      id: 'ahp.newConnector',
      title: () => translate('connectors/commands/new'),
      keywords: [english('connectors/commands/new')],
      category: 'Connectors',
      slots: [PALETTE_SLOT],
      when: served,
      run: (_ctx, args) => {
        const host = (args as ConnectorArgs | undefined)?.host ?? startHost(servingHosts(), readLastHost());
        if (host !== undefined) show(newConnectorTab(host), { component: 'NewConnectorPage', host }, bound('connectors/form/newTitle'));
      },
    }),
    scena.commands.register({
      id: 'ahp.openConnector',
      title: () => translate('connectors/commands/open'),
      run: (_ctx, args) => {
        const target = (args ?? {}) as ConnectorArgs;
        const host = target.host ?? startHost(servingHosts(), readLastHost());
        if (host === undefined || target.id === undefined) return;
        scena.store.set(ACTIVE_CONNECTOR, { host, id: target.id });
        // `connector`, not `id`: scena's own `id` would shadow it.
        show(connectorTab(host, target.id), { component: 'ConnectorPage', host, connector: target.id }, target.title ?? titleOf(host, target.id));
      },
    }),
    scena.surfaces.mount({
      surface: 'sidebar:left',
      key: 'connectors:explorer',
      when: `$/layout/surfaces/sidebar:left/section == "${CONNECTORS_SECTION}"`,
      resource: { component: 'ConnectorsExplorer' },
    }),
  );
}
