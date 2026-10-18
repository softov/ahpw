import type { BindingPath, Disposable, Scena } from '@softov/scena/types';
import { combineDisposables, translate, type ModusClass } from '@softov/scena';
import { PALETTE_SLOT } from '../../shell/CommandPalette.js';
import { hideOverlaidSidebar } from '../sessions/index.js';
import { HOST_FILTER_ACTION } from '../../bridges/hosts.js';
import { servesUsage } from '../../bridges/usage.js';
import { trackServed } from '../../bridges/served.js';
import { registerChoice, registerTicks } from '../../shell/explorer/choice.js';
import { EMOJIcon } from '../emojis.js';
import { english } from '../../i18n/locales.js';
import { ACTIVE_POOL, CHOICE_KEYS, poolTab, USAGE_ASKED, USAGE_GROUP, USAGE_GROUPS, USAGE_PERIOD, USAGE_PERIODS, USAGE_SERVED } from './state.js';

/** The display size class the modus backend publishes. */
const MODUS_CLASS = '$/modus/class' as BindingPath;

/** The sidebar section the usage list shows in. */
export const USAGE_SECTION = 'ahp:usage';

/** The menus of the list's Period and Group buttons. */
const PERIOD_SLOT = 'usage:period';
const GROUP_SLOT = 'usage:group';

/** Arguments of the command that opens a pool. */
interface PoolArgs {
  host?: string;
  pool?: string;
  /** What the tab is titled; the pool key when not given. */
  name?: string;
}

/** The usage list, by pool or summed by user, team or project, and a pool's page. Read-only. */
export function registerUsage(scena: Scena): Disposable {
  return combineDisposables(
    trackServed(scena, servesUsage, USAGE_SERVED),
    registerChoice(scena, { resource: 'usage', name: 'period', slot: PERIOD_SLOT, path: USAGE_PERIOD, values: USAGE_PERIODS, usual: 'month', key: CHOICE_KEYS.period }),
    registerTicks(scena, { resource: 'usage', name: 'group', slot: GROUP_SLOT, path: USAGE_GROUP, values: USAGE_GROUPS, key: CHOICE_KEYS.group }),
    scena.components.register({
      component: 'UsageExplorer',
      category: 'page',
      renderer: { kind: 'react', load: () => import('./Explorer.js') },
      props: {
        title: { t: 'usage/explorer/title' },
        actions: [
          { command: 'usage.reload', icon: EMOJIcon.reload, label: { t: 'common/reload' } },
          { command: 'usage.period', menu: PERIOD_SLOT, icon: EMOJIcon.period, label: { t: 'usage/explorer/period' }, active: `${USAGE_PERIOD} != null` },
          { command: 'usage.group', menu: GROUP_SLOT, icon: EMOJIcon.group, label: { t: 'usage/explorer/group' }, active: `${USAGE_GROUP} != null` },
          HOST_FILTER_ACTION,
        ],
      },
    }),
    scena.components.register({ component: 'UsagePoolPage', category: 'page', props: { icon: EMOJIcon.usage }, renderer: { kind: 'react', load: () => import('./PoolPage.js') } }),
    scena.commands.register({
      id: 'usage.reload',
      title: () => translate('common/reload'),
      run: (ctx) => { ctx.store.set(USAGE_ASKED, (ctx.store.get<number>(USAGE_ASKED) ?? 0) + 1); },
    }),
    scena.commands.register({
      id: 'ahp.showUsage',
      title: () => translate('usage/commands/show'),
      keywords: [english('usage/commands/show')],
      category: 'Usage',
      slots: [PALETTE_SLOT],
      when: () => scena.store.get<boolean>(USAGE_SERVED) === true,
      run: (ctx) => ctx.commands.execute('sidebar.activate', { section: USAGE_SECTION }),
    }),
    scena.commands.register({
      id: 'ahp.openUsagePool',
      title: () => translate('usage/commands/open'),
      run: (_ctx, args) => {
        const { host, pool, name } = (args ?? {}) as PoolArgs;
        if (host === undefined || pool === undefined) return;
        scena.store.set(ACTIVE_POOL, { host, pool });
        scena.surfaces.open({ surface: 'main', key: poolTab(host, pool), resource: { component: 'UsagePoolPage', host, pool }, props: { title: name ?? pool } });
        hideOverlaidSidebar(scena, scena.store.get<ModusClass>(MODUS_CLASS) ?? 'large');
      },
    }),
    scena.surfaces.mount({
      surface: 'sidebar:left',
      key: 'usage:explorer',
      when: `$/layout/surfaces/sidebar:left/section == "${USAGE_SECTION}"`,
      resource: { component: 'UsageExplorer' },
    }),
  );
}
