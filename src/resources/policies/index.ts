import type { BindingPath, Disposable, Scena } from '@softov/scena/types';
import { combineDisposables, translate, type ModusClass } from '@softov/scena';
import { PALETTE_SLOT } from '../../shell/CommandPalette.js';
import { hideOverlaidSidebar } from '../sessions/index.js';
import { ahpPaths, hostBridge } from '../../bridges/data.js';
import { HOST_FILTER_ACTION, onEachHost, shownHosts } from '../../bridges/hosts.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import { POLICIES, removePolicy, servesPolicies, writesPolicies } from '../../bridges/policies.js';
import { trackServed } from '../../bridges/served.js';
import { confirm, failed } from '../../shell/notify/index.js';
import { readLastHost, startHost } from '../sessions/last-host.js';
import { EMOJIcon } from '../emojis.js';
import { bound, english } from '../../i18n/locales.js';
import { ACTIVE_POLICY, POLICIES_ASKED, POLICIES_SERVED, POLICIES_WRITABLE, policyTab } from './state.js';

/** The display size class the modus backend publishes. */
const MODUS_CLASS = '$/modus/class' as BindingPath;

/** The sidebar section the policies list shows in. */
export const POLICIES_SECTION = 'ahp:policies';

/** Arguments of the commands about one policy; no `id` is a new one. */
interface PolicyArgs {
  host?: string;
  id?: string;
}

/** Keeps `path` true while any shown host takes a policy write, and false otherwise. */
function trackWritable(scena: Scena, path: BindingPath): Disposable {
  const writable = new Set<string>();
  const publish = (): void => {
    const now = writable.size > 0;
    if (scena.store.get<boolean>(path) !== now) scena.store.set(path, now);
  };
  const watching = onEachHost(scena, (host) => {
    const check = (): void => {
      if (writesPolicies(scena.store.get<Offers>(ahpPaths(host).offers) ?? NO_OFFERS)) writable.add(host);
      else writable.delete(host);
      publish();
    };
    check();
    const stop = scena.store.subscribe(ahpPaths(host).offers, check);
    return {
      dispose: () => {
        stop.dispose();
        writable.delete(host);
        publish();
      },
    };
  });
  publish();
  return watching;
}

/** The policies list, the page that edits one, and the commands that open and remove them. */
export function registerPolicies(scena: Scena): Disposable {
  type Opened = Parameters<Scena['surfaces']['open']>[0];
  const open = (key: string, resource: Opened['resource'], title: NonNullable<NonNullable<Opened['props']>['title']>): void => {
    scena.surfaces.open({ surface: 'main', key, resource, props: { title } });
    hideOverlaidSidebar(scena, scena.store.get<ModusClass>(MODUS_CLASS) ?? 'large');
  };
  const offersOf = (host: string): Offers => scena.store.get<Offers>(ahpPaths(host).offers) ?? NO_OFFERS;
  const servingHosts = (): string[] => shownHosts(scena.store).filter((host) => servesPolicies(offersOf(host)));
  const writableHosts = (): string[] => servingHosts().filter((host) => writesPolicies(offersOf(host)));

  const opener = (needsWrite: boolean) => (_ctx: unknown, args: unknown): void => {
    const target = (args ?? {}) as PolicyArgs;
    const host = target.host ?? startHost(needsWrite ? writableHosts() : servingHosts(), readLastHost());
    if (host === undefined) return;
    if (target.id !== undefined) scena.store.set(ACTIVE_POLICY, { host, id: target.id });
    const title = target.id ?? bound('policies/commands/newPolicy');
    // `policy`, not `id`: the page's record id, which scena's own `id` would shadow.
    open(policyTab(host, target.id), { component: 'PolicyPage', host, ...(target.id === undefined ? {} : { policy: target.id }) }, title);
  };
  const deleter = async (_ctx: unknown, args: unknown): Promise<void> => {
    const target = (args ?? {}) as PolicyArgs;
    if (target.host === undefined || target.id === undefined) return;
    if (!(await confirm({
      title: translate('policies/policy/deleteTitle', { id: target.id }),
      body: translate('policies/policy/deleteBody'),
      confirmLabel: translate('policies/actions/delete'),
      tone: 'danger',
    }))) return;
    await removePolicy(target.host, offersOf(target.host), target.id).then(
      () => scena.surfaces.close(policyTab(target.host!, target.id)),
      (error: unknown) => failed(translate('policies/actions/failed'), error),
    );
  };

  return combineDisposables(
    trackServed(scena, servesPolicies, POLICIES_SERVED),
    trackWritable(scena, POLICIES_WRITABLE),
    scena.components.register({
      component: 'PoliciesExplorer',
      category: 'page',
      renderer: { kind: 'react', load: () => import('./Explorer.js') },
      props: {
        title: { t: 'policies/explorer/title' },
        actions: [
          { command: 'ahp.newPolicy', icon: '+', label: { t: 'policies/commands/newPolicy' }, when: `${POLICIES_WRITABLE} == true` },
          { command: 'policies.reload', icon: EMOJIcon.reload, label: { t: 'common/reload' } },
          HOST_FILTER_ACTION,
        ],
      },
    }),
    scena.components.register({ component: 'PolicyPage', category: 'page', props: { icon: EMOJIcon.policies }, renderer: { kind: 'react', load: () => import('./PolicyPage.js') } }),
    scena.commands.register({
      id: 'ahp.newPolicy',
      title: () => translate('policies/commands/newPolicy'),
      keywords: [english('policies/commands/newPolicy')],
      category: 'Policies',
      slots: [PALETTE_SLOT],
      when: () => scena.store.get<boolean>(POLICIES_WRITABLE) === true,
      run: opener(true),
    }),
    scena.commands.register({
      id: 'policies.reload',
      title: () => translate('common/reload'),
      run: () => {
        scena.store.set(POLICIES_ASKED, (scena.store.get<number>(POLICIES_ASKED) ?? 0) + 1);
        return Promise.all(servingHosts().map((host) => hostBridge(host).refresh(POLICIES.channel)));
      },
    }),
    scena.commands.register({
      id: 'ahp.showPolicies',
      title: () => translate('policies/commands/show'),
      keywords: [english('policies/commands/show')],
      category: 'Policies',
      slots: [PALETTE_SLOT],
      when: () => scena.store.get<boolean>(POLICIES_SERVED) === true,
      run: (ctx) => ctx.commands.execute('sidebar.activate', { section: POLICIES_SECTION }),
    }),
    scena.commands.register({ id: 'ahp.openPolicy', title: () => translate('policies/commands/openPolicy'), run: opener(false) }),
    scena.commands.register({ id: 'ahp.deletePolicy', title: () => translate('policies/actions/delete'), run: deleter }),
    scena.surfaces.mount({
      surface: 'sidebar:left',
      key: 'policies:explorer',
      when: `$/layout/surfaces/sidebar:left/section == "${POLICIES_SECTION}"`,
      resource: { component: 'PoliciesExplorer' },
    }),
  );
}
