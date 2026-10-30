import type { BindingPath, Disposable, Scena } from '@softov/scena/types';
import { combineDisposables, translate, type ModusClass } from '@softov/scena';
import type { AgentInfo } from '@microsoft/agent-host-protocol';
import { AGENTS, servesEngines, type AgentRow } from '../../bridges/agents.js';
import { ahpPaths, channelPath, windowHost } from '../../bridges/data.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import type { PeopleState } from '../../bridges/people.js';
import { trackServed } from '../../bridges/served.js';
import { readLastHost, startHost } from '../sessions/last-host.js';
import { hideOverlaidSidebar } from '../sessions/index.js';
import { PALETTE_SLOT } from '../../shell/CommandPalette.js';
import { ACTIVE_AGENT, AGENT_SECTION, agentTab, ENGINES_SERVED, keepAgentTabKey, newAgentTab, type AgentSection, type SectionAsk } from './state.js';
import { EMOJIcon } from '../emojis.js';
import { bound, english } from '../../i18n/locales.js';
import { HOST_FILTER_ACTION, shownHosts } from '../../bridges/hosts.js';

/** The display size class the modus backend publishes. */
const MODUS_CLASS = '$/modus/class' as BindingPath;

/** The sidebar section the agents list shows in. */
export const AGENTS_SECTION = 'ahp:agents';

/** The agents list, the agent page, and the form that makes one. */
export function registerAgents(scena: Scena): Disposable {
  const offersOf = (host: string): Offers => scena.store.get<Offers>(ahpPaths(host).offers) ?? NO_OFFERS;
  // A new agent is made from an engine, so only a host that lists its engines offers to make one.
  const engineHosts = (): string[] => shownHosts(scena.store).filter((host) => servesEngines(offersOf(host)));
  const recordOf = (host: string, id: string): AgentRow | undefined =>
    scena.store.get<PeopleState<AgentRow>>(channelPath(host, AGENTS.channel))?.records.find((one) => one.id === id)?.record;

  return combineDisposables(
    trackServed(scena, servesEngines, ENGINES_SERVED),
    scena.components.register({
      component: 'AgentExplorer',
      category: 'page',
      renderer: { kind: 'react', load: () => import('./Explorer.js') },
      props: {
        title: { t: 'agents/explorer/title' },
        actions: [
          { command: 'ahp.newAgent', icon: '+', label: { t: 'agents/commands/new' }, when: `${ENGINES_SERVED} == true` },
          HOST_FILTER_ACTION,
        ],
      },
    }),
    scena.components.register({
      component: 'NewAgentPage',
      category: 'page',
      props: { icon: EMOJIcon.agents },
      renderer: { kind: 'react', load: () => import('./NewAgentPage.js') },
    }),
    scena.commands.register({
      id: 'ahp.newAgent',
      title: () => translate('agents/commands/new'),
      keywords: [english('agents/commands/new')],
      category: 'Agents',
      slots: [PALETTE_SLOT],
      when: () => scena.store.get<boolean>(ENGINES_SERVED) === true,
      run: (ctx, args) => {
        const host = (args as { host?: string } | undefined)?.host ?? startHost(engineHosts(), readLastHost());
        if (host === undefined) return;
        ctx.surfaces.open({ surface: 'main', key: newAgentTab(host), resource: { component: 'NewAgentPage', host }, props: { title: bound('agents/form/newTitle') } });
        hideOverlaidSidebar(ctx.scena, ctx.store.get<ModusClass>(MODUS_CLASS) ?? 'large');
      },
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
        const target = args as { provider?: string; host?: string; title?: string; section?: AgentSection } | undefined;
        if (target?.provider === undefined) return;
        const { provider, host = windowHost() } = target;
        ctx.store.set(ACTIVE_AGENT, { host, provider });
        // A part to show: the page opens on its tab and scrolls to it, open already or not.
        if (target.section !== undefined) {
          keepAgentTabKey('overview');
          ctx.store.set(AGENT_SECTION, { host, provider, section: target.section, at: Date.now() } satisfies SectionAsk);
        }
        // A record the host does not serve is in its channel only, so its title comes from there.
        const agent = ctx.store.get<AgentInfo[]>(ahpPaths(host).agents)?.find((one) => one.provider === provider);
        ctx.surfaces.open({
          surface: 'main',
          key: agentTab(host, provider),
          resource: { component: 'AgentPage', host, provider },
          props: { title: agent?.displayName ?? target.title ?? (recordOf(host, provider)?.name || provider) },
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
