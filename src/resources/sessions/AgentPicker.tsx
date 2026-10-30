import type { ReactElement } from 'react';
import { useI18n } from '@softov/scena/react';
import { Pill } from './pills.js';
import type { CustomAgent } from './custom-agents.js';

/**
 * The Agent pill: the custom agent the next message names, "Agent" for the
 * harness's default. Nothing when the harness has no custom agents, because a
 * list of one chooses nothing. `open` shows the list of `/agent`.
 */
export function AgentPicker({ agents, chosen, open }: { agents: readonly CustomAgent[]; chosen: string | undefined; open: () => void }): ReactElement | null {
  const { t } = useI18n();
  if (agents.length === 0) return null;
  const name = agents.find((one) => one.uri === chosen)?.name ?? t('sessions/commands/agent');
  return <Pill label={name} title={t('sessions/commands/agentHint')} onOpen={open} />;
}
