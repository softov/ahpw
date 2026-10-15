import type { ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Badge, Button, DetailList, Markdown, Text, type DetailItem } from '@softov/scena/ui';
import type { AgentInfo, SessionSummary } from '@microsoft/agent-host-protocol';
import { AHP_AGENTS, AHP_SESSIONS } from '../../bridges/data.js';
import { CustomizationTrees } from './Customizations.js';
import { capabilitiesOf, limitsOf, modelsLine, signInOf } from './words.js';
import { PageAlert } from '../../shell/view/PageAlert.js';

/** The policy states a person reads, under `agents/page/policy/<state>`; an enabled model says nothing. */
const POLICY = new Set(['disabled', 'unconfigured']);

/** One agent: what it is, its models, what it is customized with and how to sign in to it. */
export default function AgentPage({ provider }: { provider?: string }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const agents = useStore<AgentInfo[]>(AHP_AGENTS) ?? [];
  const sessions = useStore<SessionSummary[]>(AHP_SESSIONS) ?? [];
  const agent = agents.find((one) => one.provider === provider);
  if (agent === undefined) return <PageAlert tone="warning" message={t('agents/page/gone')} />;

  const capabilities = capabilitiesOf(agent);
  const signIn = signInOf(agent);
  const count = sessions.filter((one) => one.provider === agent.provider).length;
  const facts: DetailItem[] = [
    { label: t('agents/page/facts/provider'), value: <code>{agent.provider}</code> },
    { label: t('agents/page/facts/models'), value: modelsLine(agent) },
    { label: t('agents/page/facts/sessions'), value: String(count) },
    { label: t('agents/page/facts/can'), value: capabilities.length === 0 ? t('agents/page/oneChat') : capabilities.join('; ') },
  ];

  return (
    <div className="web-page">
      <div className="web-page__head">
        <div className="web-chat__title">
          <Text variant="h2" text={agent.displayName} />
          {signIn.some((one) => one.required) ? <Badge tone="warning" text={t('agents/page/needsSignIn')} /> : null}
        </div>
        <div className="web-page__actions">
          <Button label={t('agents/newSession')} variant="primary" onClick={() => void scena.commands.execute('ahp.newSession', { provider: agent.provider })} />
        </div>
      </div>
      {agent.description === '' ? null : <Markdown text={agent.description} />}
      <DetailList items={facts} columns={2} />

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
                <td>{limitsOf(model)}</td>
                <td>{model.policyState !== undefined && POLICY.has(String(model.policyState)) ? t(`agents/page/policy/${String(model.policyState)}`) : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {(agent.customizations ?? []).length === 0 ? null : (
        <>
          <Text variant="h3" text={t('agents/page/customizations')} />
          <CustomizationTrees items={agent.customizations} />
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
    </div>
  );
}
