import type { ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Button, DetailList, Markdown, Text, type DetailItem } from '@softov/scena/ui';
import type { AgentInfo, SessionSummary } from '@microsoft/agent-host-protocol';
import type { EngineRow, AgentRow } from '../../bridges/agents.js';
import { ahpPaths } from '../../bridges/data.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import { embedMode } from '../../shell/embed/index.js';
import { HostTag } from '../../shell/explorer/HostLines.js';
import { meOn, ownerWord } from '../connectors/actions.js';
import { customizationKinds, emptyKinds, kindCount, kindTabKey } from './kinds.js';
import { capabilitiesOf, limitsOf, modelsLine, signInOf } from './words.js';

/** The policy states a person reads, under `agents/page/policy/<state>`; an enabled model says nothing. */
const POLICY = new Set(['disabled', 'unconfigured']);

/** What the host last found when it checked an agent, as one line. */
export function healthLine(t: (key: string, values?: Record<string, unknown>) => string, record: AgentRow): string | undefined {
  const { health } = record;
  if (health === undefined) return undefined;
  const at = new Date(health.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const said = t(`agents/health/${health.result}`);
  return health.message === undefined ? t('agents/health/line', { at, result: said }) : t('agents/health/lineWith', { at, result: said, message: health.message });
}

/**
 * One agent's Overview: what it is, its record's engine, owner and plugin, its
 * models, what it is customized with and how to sign in to it. An agent the
 * host does not serve has its record's facts only.
 */
export function Overview({ host, info, record, engine }: { host: string; info?: AgentInfo; record?: AgentRow; engine?: EngineRow }): ReactElement {
  const { t } = useI18n();
  const sessions = useStore<SessionSummary[]>(ahpPaths(host).sessions) ?? [];
  const offers = useStore<Offers>(ahpPaths(host).offers) ?? NO_OFFERS;
  const id = info?.provider ?? record?.id ?? '';
  const capabilities = info === undefined ? [] : capabilitiesOf(info);
  const signIn = info === undefined ? [] : signInOf(info);
  const count = sessions.filter((one) => one.provider === id).length;
  const health = record === undefined ? undefined : healthLine(t, record);
  const facts: DetailItem[] = [
    ...(embedMode() === 'multi' ? [{ label: t('common/host'), value: <HostTag host={host} /> }] : []),
    { label: t('agents/page/facts/provider'), value: <code>{id}</code> },
    ...(record === undefined ? [] : [
      { label: t('agents/page/facts/engine'), value: engine?.title ?? record.engine },
      { label: t('agents/page/facts/owner'), value: ownerWord(t, record.owner, meOn(offers)) },
      ...(engine === undefined ? [] : [{ label: t('agents/page/facts/plugin'), value: <code>{engine.plugin}</code> }]),
      { label: t('agents/page/facts/state'), value: [t(`connectors/states/${record.state}`), health].filter((bit) => bit !== undefined).join(' \u{00B7} ') },
    ]),
    ...(info === undefined ? [] : [
      { label: t('agents/page/facts/models'), value: modelsLine(info) },
      { label: t('agents/page/facts/sessions'), value: String(count) },
      { label: t('agents/page/facts/can'), value: capabilities.length === 0 ? t('agents/page/oneChat') : capabilities.join('; ') },
    ]),
  ];
  const description = info?.description || record?.description || '';

  return (
    <div className="web-agent__overview">
      {description === '' ? null : <Markdown text={description} />}
      <DetailList items={facts} columns={2} />
      {info === undefined ? null : <Served host={host} agent={info} signIn={signIn} />}
    </div>
  );
}

/** What the host serves of an agent: its models, its customizations and its sign-in. */
function Served({ host, agent, signIn }: { host: string; agent: AgentInfo; signIn: ReturnType<typeof signInOf> }): ReactElement {
  const { t } = useI18n();
  const scena = useScena();
  const kinds = customizationKinds(agent.customizations).filter((tab) => tab.count > 0);
  const empty = emptyKinds(kinds);
  return (
    <>
      <Text variant="h3" text={t('agents/page/models')} />
      {agent.models.length === 0 ? <p className="web-note">{t('agents/page/noModels')}</p> : (
        <table className="web-runs web-table">
          <thead>
            <tr><th>{t('agents/page/columns/name')}</th><th>{t('agents/page/columns/id')}</th><th>{t('agents/page/columns/limits')}</th><th /></tr>
          </thead>
          <tbody>
            {agent.models.map((model) => (
              <tr key={model.id}>
                <td>{model.name}</td>
                <td><code>{model.id}</code></td>
                <td>
                  <span className="web-limits">
                    {limitsOf(model).map((limit) => (
                      <span key={limit.title} title={limit.title} aria-label={limit.title}><span aria-hidden="true">{limit.icon}</span>{limit.text}</span>
                    ))}
                  </span>
                </td>
                <td>{model.policyState !== undefined && POLICY.has(String(model.policyState)) ? t(`agents/page/policy/${String(model.policyState)}`) : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {(agent.customizations ?? []).length === 0 ? null : (
        <>
          <Text variant="h3" text={t('agents/page/customizations')} />
          <div className="web-agent__kinds">
            {kinds.length === 0 ? <span>{t('agents/customizations/none')}</span> : kinds.map((tab) => (
              <Button
                key={tab.kind}
                size="sm"
                variant="ghost"
                label={kindCount(tab)}
                onClick={() => void scena.commands.execute('ahp.openAgent', { host, provider: agent.provider, section: kindTabKey(tab.kind) })}
              />
            ))}
            {empty.length === 0 ? null : <span className="web-note">{t('agents/customizations/noneOf', { kinds: empty.join(', ') })}</span>}
          </div>
        </>
      )}

      {signIn.length === 0 ? null : (
        <>
          <Text variant="h3" text={t('agents/page/signIn')} />
          <table className="web-runs web-table">
            <thead>
              <tr><th>{t('agents/page/columns/resource')}</th><th>{t('agents/page/columns/scopes')}</th><th /></tr>
            </thead>
            <tbody>
              {signIn.map((one) => (
                <tr key={one.name}><td>{one.name}</td><td>{one.scopes}</td><td>{t(one.required ? 'agents/page/required' : 'agents/page/optional')}</td></tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </>
  );
}
