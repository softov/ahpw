import { useMemo, useState, type ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Alert, Badge, Button, Tabs, type BadgeTone } from '@softov/scena/ui';
import type { AgentInfo } from '@microsoft/agent-host-protocol';
import { AGENT_KINDS, AGENTS, agentKindsReducer, agentsReducer, checkAgent, servesAgentKinds, servesAgents, type AgentKindRow, type AgentRow } from '../../bridges/agents.js';
import { useChannel } from '../../bridges/channel.js';
import { ahpPaths } from '../../bridges/data.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import type { PeopleState } from '../../bridges/people.js';
import { PageTitle } from '../../shell/HostIcon.js';
import { PageAlert } from '../../shell/view/PageAlert.js';
import { failed } from '../../shell/notify/index.js';
import { EMOJIcon } from '../emojis.js';
import { deleteAgent } from './actions.js';
import { AgentForm } from './AgentForm.js';
import { agentTitle, mergeAgents, type MergedAgent } from './merge.js';
import { healthLine, Overview } from './Overview.js';
import { agentTab, agentTabKey, keepAgentTabKey } from './state.js';
import { signInOf } from './words.js';

/** A status badge's tone: a served record as a ready connector, a standby one by its state. */
const toneOf = (agent: MergedAgent): BadgeTone => {
  if (agent.status === 'standalone') return 'default';
  if (agent.status === 'configured') return 'success';
  return agent.record?.state === 'unavailable' ? 'danger' : 'warning';
};

/** A record's last check, and the button that runs one again. */
function Health({ host, record }: { host: string; record: AgentRow }): ReactElement {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const line = healthLine(t, record);
  const check = (): void => {
    setBusy(true);
    checkAgent(host, record.id).then(
      () => setBusy(false),
      (caught: unknown) => { setBusy(false); failed(t('agents/actions/checkFailed', { name: record.name || record.id }), caught); },
    );
  };
  return (
    <div className="web-agent__health">
      <span className="web-note">{line ?? t('agents/health/never')}</span>
      <Button size="sm" label={t('agents/actions/check')} disabled={busy} onClick={check} />
    </div>
  );
}

/**
 * One agent: its head with its status, over Overview and Settings. An agent
 * the host serves with no record has nothing to set, so it shows its Overview
 * alone.
 */
export default function AgentPage({ host, provider }: { host: string; provider?: string }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const offers = useStore<Offers>(ahpPaths(host).offers) ?? NO_OFFERS;
  const infos = useStore<AgentInfo[]>(ahpPaths(host).agents) ?? [];
  const records = useChannel<PeopleState<AgentRow>>(host, servesAgents(offers) ? AGENTS.channel : undefined, agentsReducer).state;
  const kinds = useChannel<PeopleState<AgentKindRow>>(host, servesAgentKinds(offers) ? AGENT_KINDS.channel : undefined, agentKindsReducer).state;
  const agent = useMemo(
    () => mergeAgents(infos.filter((one) => one.provider === provider), (records?.records ?? []).map((one) => one.record).filter((one) => one.id === provider))[0],
    [infos, records, provider],
  );
  if (agent === undefined || provider === undefined) return <PageAlert tone="warning" message={t('agents/page/gone')} />;

  const { info, record } = agent;
  const kind = record === undefined ? undefined : kinds?.records.find((one) => one.id === record.kind)?.record;
  const signIn = info === undefined ? [] : signInOf(info);
  const icons = record?.icon === undefined ? kind?.icons : [record.icon];
  const overview = <Overview host={host} {...(info === undefined ? {} : { info })} {...(record === undefined ? {} : { record })} {...(kind === undefined ? {} : { kind })} />;
  const remove = record === undefined ? null : (
    <Button
      variant="danger"
      label={t('agents/actions/remove')}
      onClick={() => void deleteAgent(host, record).then((gone) => { if (gone) scena.surfaces.close(agentTab(host, provider)); })}
    />
  );

  return (
    <div className="web-page web-agent">
      <div className="web-page__head">
        <PageTitle
          icons={icons}
          emoji={EMOJIcon.agents}
          title={agentTitle(agent)}
          uri={record === undefined ? provider : `${AGENTS.channel}${provider}`}
          state={(
            <>
              <Badge tone={toneOf(agent)} text={t(`agents/explorer/status/${agent.status}`)} />
              {signIn.some((one) => one.required) ? <Badge tone="warning" text={t('agents/page/needsSignIn')} /> : null}
            </>
          )}
        />
        <div className="web-page__actions">
          {info === undefined ? null : <Button label={t('agents/newSession')} variant="primary" onClick={() => void scena.commands.execute('ahp.newSession', { host, provider })} />}
        </div>
      </div>
      {agent.status !== 'standby' || record === undefined ? null : (
        <Alert tone={record.state === 'unavailable' ? 'danger' : 'warning'} message={t(`agents/page/standby/${record.state}`, { kind: record.kind })} />
      )}
      {record === undefined ? overview : (
        <Tabs
          tabs={[
            { key: 'overview', title: t('agents/page/overview'), child: overview },
            {
              key: 'settings',
              title: t('agents/page/settings'),
              child: (
                <div className="web-agent__settings">
                  <Health host={host} record={record} />
                  <AgentForm host={host} record={record} {...(remove === null ? {} : { actions: remove })} />
                </div>
              ),
            },
          ]}
          defaultValue={agentTabKey()}
          onChange={keepAgentTabKey}
        />
      )}
    </div>
  );
}
