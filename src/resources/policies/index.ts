import type { BindingPath, Disposable, Scena } from '@softov/scena/types';
import { combineDisposables, translate, type ModusClass } from '@softov/scena';
import { PALETTE_SLOT } from '../../shell/CommandPalette.js';
import { hideOverlaidSidebar } from '../sessions/index.js';
import { ahpPaths, hostBridge } from '../../bridges/data.js';
import { HOST_FILTER_ACTION, shownHosts } from '../../bridges/hosts.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import { POLICIES, POLICIES_CHANNEL, POLICY_GROUPINGS, removePolicy, servesPolicies } from '../../bridges/policies.js';
import { trackServed } from '../../bridges/served.js';
import { registerChoice } from '../../shell/explorer/choice.js';
import { confirm, failed } from '../../shell/notify/index.js';
import { readLastHost, startHost } from '../sessions/last-host.js';
import { EMOJIcon } from '../emojis.js';
import { bound, english } from '../../i18n/locales.js';
import { ACTIVE_POLICY, GROUP_KEY, policyTab, POLICIES_GROUP, POLICIES_SERVED } from './state.js';

/** The display size class the modus backend publishes. */
const MODUS_CLASS = '$/modus/class' as BindingPath;

/** The sidebar section the policies list shows in. */
export const POLICIES_SECTION = 'ahp:policies';

/** The menu of the list's Group button. */
const GROUP_SLOT = 'policies:group';

/** Arguments of the commands about one policy; no `id` is a new one. */
export interface PolicyArgs {
  host?: string;
  id?: string;
}

/** The policies list, grouped by kind, by scope or not at all, and a page that shows and edits each row. */
export function registerPolicies(scena: Scena): Disposable {
  const offersOf = (host: string): Offers => scena.store.get<Offers>(ahpPaths(host).offers) ?? NO_OFFERS;
  const servingHosts = (): string[] => shownHosts(scena.store).filter((host) => servesPolicies(offersOf(host)));
  const served = (): boolean => scena.store.get<boolean>(POLICIES_SERVED) === true;

  const open = (_ctx: unknown, args: unknown): void => {
    const target = (args ?? {}) as PolicyArgs;
    const host = target.host ?? startHost(servingHosts(), readLastHost());
    if (host === undefined) return;
    if (target.id !== undefined) scena.store.set(ACTIVE_POLICY, { host, id: target.id });
    // `policy`, not `id`: the page's row id, which scena's own `id` would shadow.
    scena.surfaces.open({
      surface: 'main',
      key: policyTab(host, target.id),
      resource: { component: 'PolicyPage', host, ...(target.id === undefined ? {} : { policy: target.id }) },
      props: { title: target.id ?? bound('policies/commands/new') },
    });
    hideOverlaidSidebar(scena, scena.store.get<ModusClass>(MODUS_CLASS) ?? 'large');
  };

  const remove = async (_ctx: unknown, args: unknown): Promise<void> => {
    const { host, id } = (args ?? {}) as PolicyArgs;
    if (host === undefined || id === undefined) return;
    if (!(await confirm({
      title: translate('policies/policy/deleteTitle', { id }),
      body: translate('policies/policy/deleteBody'),
      confirmLabel: translate('policies/actions/delete'),
      tone: 'danger',
    }))) return;
    await removePolicy(host, offersOf(host), id).then(
      () => scena.surfaces.close(policyTab(host, id)),
      (error: unknown) => failed(translate('policies/actions/failed'), error),
    );
  };

  return combineDisposables(
    trackServed(scena, POLICIES_CHANNEL, POLICIES_SERVED),
    registerChoice(scena, { resource: 'policies', name: 'group', slot: GROUP_SLOT, path: POLICIES_GROUP, values: POLICY_GROUPINGS, usual: 'kind', key: GROUP_KEY }),
    scena.components.register({
      component: 'PoliciesExplorer',
      category: 'page',
      renderer: { kind: 'react', load: () => import('./Explorer.js') },
      props: {
        title: { t: 'policies/explorer/title' },
        actions: [
          { command: 'ahp.newPolicy', icon: '+', label: { t: 'policies/commands/new' } },
          { command: 'policies.reload', icon: EMOJIcon.reload, label: { t: 'common/reload' } },
          { command: 'policies.group', menu: GROUP_SLOT, icon: EMOJIcon.group, label: { t: 'policies/explorer/group' }, active: `${POLICIES_GROUP} != null` },
          HOST_FILTER_ACTION,
        ],
      },
    }),
    scena.components.register({ component: 'PolicyPage', category: 'page', props: { icon: EMOJIcon.policies }, renderer: { kind: 'react', load: () => import('./PolicyPage.js') } }),
    scena.commands.register({
      id: 'policies.reload',
      title: () => translate('common/reload'),
      run: () => Promise.all(servingHosts().map((host) => hostBridge(host).refresh(POLICIES.channel))),
    }),
    scena.commands.register({
      id: 'ahp.showPolicies',
      title: () => translate('policies/commands/show'),
      keywords: [english('policies/commands/show')],
      category: 'Policies',
      slots: [PALETTE_SLOT],
      when: served,
      run: (ctx) => ctx.commands.execute('sidebar.activate', { section: POLICIES_SECTION }),
    }),
    scena.commands.register({
      id: 'ahp.newPolicy',
      title: () => translate('policies/commands/new'),
      keywords: [english('policies/commands/new')],
      category: 'Policies',
      slots: [PALETTE_SLOT],
      when: served,
      run: (ctx, args) => open(ctx, { host: (args as PolicyArgs | undefined)?.host }),
    }),
    scena.commands.register({ id: 'ahp.openPolicy', title: () => translate('policies/commands/open'), run: open }),
    scena.commands.register({ id: 'ahp.deletePolicy', title: () => translate('policies/actions/delete'), run: remove }),
    scena.surfaces.mount({
      surface: 'sidebar:left',
      key: 'policies:explorer',
      when: `$/layout/surfaces/sidebar:left/section == "${POLICIES_SECTION}"`,
      resource: { component: 'PoliciesExplorer' },
    }),
  );
}
