import { useMemo, useState, type ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Alert, Badge, Button, Tabs, type BadgeTone } from '@softov/scena/ui';
import type { AgentInfo } from '@microsoft/agent-host-protocol';
import { ENGINES, AGENTS, enginesReducer, agentsReducer, checkAgent, servesEngines, servesAgents, type EngineRow, type AgentRow } from '../../bridges/agents.js';
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
import { agentIcons } from './icons.js';
import { healthLine, Overview } from './Overview.js';
import { AGENT_SECTION, agentTab, agentTabKey, keepAgentTabKey, type SectionAsk } from './state.js';
import { signInOf } from './words.js';
import { KindPanel } from './Customizations.js';
import { customizationKinds, kindTabKey, kindTabTitle } from './kinds.js';
import { DangerZone } from '../../shell/controls/DangerZone.js';

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
 * One agent: its head with its status, over Overview, a tab for each kind of
 * its customizations, and Settings. Settings shows for an agent with a record;
 * an agent with neither shows its Overview alone.
 */
export default function AgentPage({ host, provider }: { host: string; provider?: string }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const offers = useStore<Offers>(ahpPaths(host).offers) ?? NO_OFFERS;
  const infos = useStore<AgentInfo[]>(ahpPaths(host).agents) ?? [];
  const ask = useStore<SectionAsk>(AGENT_SECTION);
  const records = useChannel<PeopleState<AgentRow>>(host, servesAgents(offers) ? AGENTS.channel : undefined, agentsReducer).state;
  const engines = useChannel<PeopleState<EngineRow>>(host, servesEngines(offers) ? ENGINES.channel : undefined, enginesReducer).state;
  const agent = useMemo(
    () => mergeAgents(infos.filter((one) => one.provider === provider), (records?.records ?? []).map((one) => one.record).filter((one) => one.id === provider))[0],
    [infos, records, provider],
  );
  if (agent === undefined || provider === undefined) return <PageAlert tone="warning" message={t('agents/page/gone')} />;

  const { info, record } = agent;
  const engine = record === undefined ? undefined : engines?.records.find((one) => one.id === record.engine)?.record;
  const signIn = info === undefined ? [] : signInOf(info);
  const icons = agentIcons(record, engines?.records ?? []);
  const overview = <Overview host={host} {...(info === undefined ? {} : { info })} {...(record === undefined ? {} : { record })} {...(engine === undefined ? {} : { engine })} />;

  const kinds = customizationKinds(info?.customizations);
  const tabs = [
    { key: 'overview', title: t('agents/page/overview'), child: overview },
    ...kinds.map((kind) => ({ key: kindTabKey(kind.kind), title: kindTabTitle(kind), child: <KindPanel host={host} tab={kind} /> })),
    ...(record === undefined ? [] : [{
      key: 'settings',
      title: t('agents/page/settings'),
      child: (
        <div className="web-agent__settings">
          <Health host={host} record={record} />
          <AgentForm host={host} record={record} />
          <DangerZone
            label={t('agents/actions/remove')}
            onClick={() => void deleteAgent(host, record).then((gone) => { if (gone) scena.surfaces.close(agentTab(host, provider)); })}
          />
        </div>
      ),
    }]),
  ];
  const chosen = agentTabKey();
  const first = kinds[0];
  const opens = chosen === 'customizations' && first !== undefined ? kindTabKey(first.kind) : chosen;

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
        <Alert tone={record.state === 'unavailable' ? 'danger' : 'warning'} message={t(`agents/page/standby/${record.state}`, { engine: record.engine })} />
      )}
      {tabs.length === 1 ? overview : (
        <Tabs
          key={ask?.host === host && ask.provider === provider ? ask.at : 0}
          tabs={tabs}
          defaultValue={opens}
          onChange={keepAgentTabKey}
        />
      )}
    </div>
  );
}
