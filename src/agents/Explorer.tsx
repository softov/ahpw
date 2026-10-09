import { useMemo, type ReactElement } from 'react';
import { useScena, useStore } from '@softov/scena/react';
import type { AgentInfo, SessionSummary } from '@microsoft/agent-host-protocol';
import { AHP_AGENTS, AHP_SESSIONS } from '../connection/data.js';
import { ExplorerList, type Row } from '../explorer/ExplorerList.js';
import { ACTIVE_AGENT } from './state.js';
import { modelsLine, signInOf } from './words.js';

/** The sidebar: the agents the daemon offers, with their models and how many sessions each has. The host says when the list changes. */
export default function AgentExplorer(): ReactElement {
  const scena = useScena();
  const agents = useStore<AgentInfo[]>(AHP_AGENTS) ?? [];
  const sessions = useStore<SessionSummary[]>(AHP_SESSIONS) ?? [];
  const active = useStore<string>(ACTIVE_AGENT);
  const open = (provider: string): void => void scena.commands.execute('ahp.openAgent', { provider });
  const start = (provider: string): void => void scena.commands.execute('ahp.newSession', { provider });

  const rows = useMemo<Row[]>(
    () => agents.map((agent) => {
      const count = sessions.filter((one) => one.provider === agent.provider).length;
      const signIn = signInOf(agent).some((one) => one.required);
      return {
        key: agent.provider,
        dot: 'ok',
        dotLabel: 'Offered',
        title: agent.displayName,
        lines: [
          [modelsLine(agent), count === 1 ? '1 session' : `${count} sessions`, signIn ? 'needs sign-in' : undefined].filter((bit) => bit !== undefined).join(' \u{00B7} '),
          ...(agent.description === '' ? [] : [agent.description]),
        ],
        menu: [
          { title: 'Open', onSelect: (host) => { host.closeMenu(); open(agent.provider); } },
          { title: 'New session', onSelect: (host) => { host.closeMenu(); start(agent.provider); } },
        ],
      } satisfies Row;
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [agents, sessions],
  );

  return (
    <ExplorerList
      title="Agents"
      actions={[]}
      rows={rows}
      selected={active ?? null}
      onOpen={open}
      notice={rows.length === 0 ? <p className="web-note web-explorer__empty">This server offers no agent.</p> : null}
      filterLabel="Filter agents"
    />
  );
}
