import type { BindingPath, Disposable, Scena } from '@softov/scena/types';
import { combineDisposables, type ModusClass } from '@softov/scena';
import type { AgentInfo } from '@microsoft/agent-host-protocol';
import { AHP_AGENTS } from '../connection/data.js';
import { hideOverlaidSidebar } from '../sessions/index.js';
import { PALETTE_SLOT } from '../view/Palette.js';
import { ACTIVE_AGENT } from './state.js';
import AgentExplorer from './Explorer.js';
import AgentPage from './Page.js';
import { ICONS } from '../icons.js';

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
      renderer: { kind: 'react', load: async () => ({ default: AgentExplorer as unknown }) },
    }),
    scena.components.register({
      component: 'AgentPage',
      category: 'page',
      renderer: { kind: 'react', load: async () => ({ default: AgentPage as unknown }) },
    }),
    scena.commands.register({
      id: 'ahp.showAgents',
      title: 'Show agents',
      category: 'Agents',
      slots: [PALETTE_SLOT],
      run: (ctx) => ctx.commands.execute('sidebar.activate', { section: AGENTS_SECTION }),
    }),
    scena.commands.register({
      id: 'ahp.openAgent',
      title: 'Open agent',
      run: (ctx, args) => {
        const provider = (args as { provider?: string } | undefined)?.provider;
        if (provider === undefined) return;
        ctx.store.set(ACTIVE_AGENT, provider);
        const agent = ctx.store.get<AgentInfo[]>(AHP_AGENTS)?.find((one) => one.provider === provider);
        ctx.surfaces.open({
          surface: 'main',
          key: `agent:${provider}`,
          resource: { component: 'AgentPage', provider },
          props: { title: agent?.displayName ?? provider, icon: ICONS.agents },
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
