import type { BindingPath } from '@softov/scena/types';

/** Whether any host this page connects to lists its engines; the explorer's + shows while one does. */
export const ENGINES_SERVED = '$/ahp/agents/enginesServed' as BindingPath;

/** The agent whose page is open, as `{ host, provider }`. */
export const ACTIVE_AGENT = '$/ahp/activeAgent' as BindingPath;

/** A part of an agent's page to show, as `{ host, provider, section, at }`; `at` tells two asks for the same part apart. */
export const AGENT_SECTION = '$/ahp/agentSection' as BindingPath;

/** The parts of an agent's page that `ahp.openAgent` can show: its first kind of customizations, or one kind's tab as `kind:<kind>`. */
export type AgentSection = 'customizations' | `kind:${string}`;

/** An ask to show a part of an agent's page. */
export interface SectionAsk { host: string; provider: string; section: AgentSection; at: number }

/** An agent's tab key: one tab each. */
export const agentTab = (host: string, provider: string): string => `agent:${host}:${provider}`;

/** The new-agent form's tab key: one for each host. */
export const newAgentTab = (host: string): string => `agents:new:${host}`;

/** The tab an agent's page opens on: the one chosen last, kept while the page lives; a page without that tab opens on its first kind, or its Overview. */
let chosenTab = 'overview';
export const agentTabKey = (): string => chosenTab;
export function keepAgentTabKey(key: string): void {
  chosenTab = key;
}
