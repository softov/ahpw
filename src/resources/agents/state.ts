import type { BindingPath } from '@softov/scena/types';

/** Whether any host this page connects to lists its engines; the explorer's + shows while one does. */
export const ENGINES_SERVED = '$/ahp/agents/enginesServed' as BindingPath;

/** The agent whose page is open, as `{ host, provider }`. */
export const ACTIVE_AGENT = '$/ahp/activeAgent' as BindingPath;

/** A part of an agent's page to scroll to, as `{ host, provider, section, at }`; `at` tells two asks for the same part apart. */
export const AGENT_SECTION = '$/ahp/agentSection' as BindingPath;

/** The parts of an agent's page that `ahp.openAgent` can scroll to. */
export type AgentSection = 'customizations';

/** An ask to show a part of an agent's page. */
export interface SectionAsk { host: string; provider: string; section: AgentSection; at: number }

/** An agent's tab key: one tab each. */
export const agentTab = (host: string, provider: string): string => `agent:${host}:${provider}`;

/** The new-agent form's tab key: one for each host. */
export const newAgentTab = (host: string): string => `agents:new:${host}`;

/** An agent page's tabs. */
export type AgentTabKey = 'overview' | 'settings';

/** The tab an agent's page opens on: the one chosen last, kept while the page lives. */
let chosenTab: AgentTabKey = 'overview';
export const agentTabKey = (): AgentTabKey => chosenTab;
export function keepAgentTabKey(key: string): void {
  if (key === 'overview' || key === 'settings') chosenTab = key;
}
