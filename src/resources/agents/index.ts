import type { BindingPath, Disposable, Scena } from '@softov/scena/types';
import { combineDisposables, translate, type ModusClass } from '@softov/scena';
import type { AgentInfo } from '@microsoft/agent-host-protocol';
import { ahpPaths, windowHost } from '../../bridges/data.js';
import { hideOverlaidSidebar } from '../sessions/index.js';
import { PALETTE_SLOT } from '../../shell/CommandPalette.js';
import { ACTIVE_AGENT } from './state.js';
import { EMOJIcon } from '../emojis.js';
import { english } from '../../i18n/locales.js';
import { HOST_FILTER_ACTION } from '../../bridges/hosts.js';

/** The display size class the modus backend publishes. */
const MODUS_CLASS = '$/modus/class' as BindingPath;

/** The sidebar section the agents list shows in. */
export const AGENTS_SECTION = 'ahp:agents';

/** The agents list and the agent page. */
export function registerAgents(scena: Scena): Disposable {
  return combineDisposables(
    scena.components.register({
      component: 'AgentExplorer',
      category: 'page',
      renderer: { kind: 'react', load: () => import('./Explorer.js') },
      props: { title: { t: 'agents/explorer/title' }, actions: [HOST_FILTER_ACTION] },
    }),
    scena.components.register({
      component: 'AgentPage',
      category: 'page',
      props: { icon: EMOJIcon.agents },
      renderer: { kind: 'react', load: () => import('./Page.js') },
    }),
    scena.commands.register({
      id: 'ahp.showAgents',
      title: () => translate('agents/commands/show'),
      keywords: [english('agents/commands/show')],
      category: 'Agents',
      slots: [PALETTE_SLOT],
      run: (ctx) => ctx.commands.execute('sidebar.activate', { section: AGENTS_SECTION }),
    }),
    scena.commands.register({
      id: 'ahp.openAgent',
      title: () => translate('agents/commands/open'),
      run: (ctx, args) => {
        const target = args as { provider?: string; host?: string } | undefined;
        if (target?.provider === undefined) return;
        const { provider, host = windowHost() } = target;
        ctx.store.set(ACTIVE_AGENT, { host, provider });
        const agent = ctx.store.get<AgentInfo[]>(ahpPaths(host).agents)?.find((one) => one.provider === provider);
        ctx.surfaces.open({
          surface: 'main',
          key: `agent:${host}:${provider}`,
          resource: { component: 'AgentPage', host, provider },
          props: { title: agent?.displayName ?? provider },
        });
        hideOverlaidSidebar(ctx.scena, ctx.store.get<ModusClass>(MODUS_CLASS) ?? 'large');
      },
    }),
    scena.surfaces.mount({
      surface: 'sidebar:left',
      key: 'agents:explorer',
      when: `$/layout/surfaces/sidebar:left/section == "${AGENTS_SECTION}"`,
      resource: { component: 'AgentExplorer' },
    }),
  );
}
