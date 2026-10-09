import type { ReactElement } from 'react';
import { useScena, useStore } from '@softov/scena/react';
import { Alert, Badge, Button, DetailList, Markdown, Text, type DetailItem } from '@softov/scena/ui';
import type { AgentInfo, SessionSummary } from '@microsoft/agent-host-protocol';
import { AHP_AGENTS, AHP_SESSIONS } from '../connection/data.js';
import { capabilitiesOf, customizationOf, limitsOf, modelsLine, signInOf } from './words.js';

/** A policy state as a person reads it; an enabled model says nothing. */
const POLICY: Record<string, string> = { disabled: 'Turned off by policy', unconfigured: 'Not set up' };

/** One agent: what it is, its models, what it is customized with and how to sign in to it. */
export default function AgentPage({ provider }: { provider?: string }): ReactElement {
  const scena = useScena();
  const agents = useStore<AgentInfo[]>(AHP_AGENTS) ?? [];
  const sessions = useStore<SessionSummary[]>(AHP_SESSIONS) ?? [];
  const agent = agents.find((one) => one.provider === provider);
  if (agent === undefined) return <Alert tone="warning" message="This server no longer offers this agent." />;

  const capabilities = capabilitiesOf(agent);
  const customizations = (agent.customizations ?? []).map(customizationOf);
  const signIn = signInOf(agent);
  const count = sessions.filter((one) => one.provider === agent.provider).length;
  const facts: DetailItem[] = [
    { label: 'Provider', value: <code>{agent.provider}</code> },
    { label: 'Models', value: modelsLine(agent) },
    { label: 'Sessions', value: String(count) },
    { label: 'Can', value: capabilities.length === 0 ? 'One chat in one folder per session' : capabilities.join('; ') },
  ];

  return (
    <div className="web-page">
      <div className="web-page__head">
        <div className="web-chat__title">
          <Text variant="h2" text={agent.displayName} />
          {signIn.some((one) => one.required) ? <Badge tone="warning" text="Needs sign-in" /> : null}
        </div>
        <div className="web-page__actions">
          <Button label="New session" variant="primary" onClick={() => void scena.commands.execute('ahp.newSession', { provider: agent.provider })} />
        </div>
      </div>
      {agent.description === '' ? null : <Markdown text={agent.description} />}
      <DetailList items={facts} columns={2} />

      <Text variant="h3" text="Models" />
      {agent.models.length === 0 ? <p className="web-note">This agent lists no models; it picks its own.</p> : (
        <table className="web-runs web-table">
          <thead>
            <tr><th>Name</th><th>Id</th><th>Limits</th><th /></tr>
          </thead>
          <tbody>
            {agent.models.map((model) => (
              <tr key={model.id}>
                <td>{model.name}</td>
                <td><code>{model.id}</code></td>
                <td>{limitsOf(model)}</td>
                <td>{model.policyState === undefined ? '' : POLICY[String(model.policyState)] ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {customizations.length === 0 ? null : (
        <>
          <Text variant="h3" text="Customizations" />
          <table className="web-runs web-table">
            <thead>
              <tr><th>Name</th><th>Kind</th><th>State</th></tr>
            </thead>
            <tbody>
              {customizations.map((one, index) => (
                <tr key={index}><td>{one.name}</td><td>{one.kind}</td><td>{one.state}</td></tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {signIn.length === 0 ? null : (
        <>
          <Text variant="h3" text="Sign-in" />
          <table className="web-runs web-table">
            <thead>
              <tr><th>Resource</th><th>Scopes</th><th /></tr>
            </thead>
            <tbody>
              {signIn.map((one) => (
                <tr key={one.name}><td>{one.name}</td><td>{one.scopes}</td><td>{one.required ? 'Required' : 'Optional'}</td></tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
