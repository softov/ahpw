import { useMemo, type ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import type { AgentInfo, SessionSummary } from '@microsoft/agent-host-protocol';
import { ahpPaths } from '../../bridges/data.js';
import { refKey, refOf, useEach, useHostNames, useShownHosts } from '../../bridges/hosts.js';
import { embedMode } from '../../shell/embed/index.js';
import { ExplorerList, type Row } from '../../shell/explorer/ExplorerList.js';
import { ACTIVE_AGENT } from './state.js';
import { modelsLine, signInOf } from './words.js';
import { plural } from '../../i18n/locales.js';

/** The sidebar: the agents the shown hosts offer, with their models and how many sessions each has. Each host says when its list changes. */
export default function AgentExplorer(): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const hosts = useShownHosts();
  const hostName = useHostNames();
  const multi = embedMode() === 'multi';
  const agentLists = useEach<AgentInfo[]>(hosts.map((host) => ahpPaths(host).agents));
  const sessionLists = useEach<SessionSummary[]>(hosts.map((host) => ahpPaths(host).sessions));
  const active = useStore<{ host: string; provider: string }>(ACTIVE_AGENT);
  const open = (key: string): void => {
    const { host, id } = refOf(key);
    void scena.commands.execute('ahp.openAgent', { host, provider: id });
  };
  const start = (host: string, provider: string): void => void scena.commands.execute('ahp.newSession', { host, provider });

  const rows = useMemo<Row[]>(
    () => hosts.flatMap((host, at) => (agentLists[at] ?? []).map((agent) => {
      const count = (sessionLists[at] ?? []).filter((one) => one.provider === agent.provider).length;
      const signIn = signInOf(agent).some((one) => one.required);
      return {
        key: refKey(host, agent.provider),
        dot: 'ok',
        dotLabel: t('agents/explorer/offered'),
        title: agent.displayName,
        lines: [
          [multi ? hostName(host) : undefined, modelsLine(agent), plural('agents/explorer/sessions', count), signIn ? t('agents/explorer/needsSignIn') : undefined].filter((bit) => bit !== undefined).join(' \u{00B7} '),
          ...(agent.description === '' ? [] : [agent.description]),
        ],
        menu: [
          { title: t('agents/explorer/open'), onSelect: (menu) => { menu.closeMenu(); open(refKey(host, agent.provider)); } },
          { title: t('agents/newSession'), onSelect: (menu) => { menu.closeMenu(); start(host, agent.provider); } },
        ],
      } satisfies Row;
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hosts, agentLists, sessionLists, hostName, t],
  );

  return (
    <ExplorerList
      label={t('agents/explorer/title')}
      rows={rows}
      selected={active === undefined ? null : refKey(active.host, active.provider)}
      onOpen={open}
      notice={rows.length === 0 ? <p className="web-note web-explorer__empty">{t('agents/explorer/empty')}</p> : null}
      filterLabel={t('agents/explorer/filter')}
      hostLines={multi}
    />
  );
}
