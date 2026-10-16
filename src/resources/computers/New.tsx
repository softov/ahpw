import { useMemo, useState, type ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Button, SchemaForm, Text, type JsonSchemaObject } from '@softov/scena/ui';
import { ahpPaths } from '../../bridges/data.js';
import { useHostNames, useShownHosts } from '../../bridges/hosts.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import { useServingHosts } from '../../bridges/served.js';
import { embedMode } from '../../shell/embed/index.js';
import { PageAlert } from '../../shell/view/PageAlert.js';
import { writeLastHost } from '../sessions/last-host.js';
import { may } from './actions.js';
import { COMPUTER_PROVIDER, COMPUTERS_SCHEME, createComputer } from './machines.js';
import { formSchema, manifestBody, nameProblem } from './manifest.js';

/** Makes a computer: its host with every host, its name, and the answers to the host's manifest schema. */
export default function NewComputerPage({ host: opened }: { host: string }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const hosts = useServingHosts(useShownHosts(), COMPUTERS_SCHEME);
  const hostName = useHostNames();
  const [host, setHost] = useState(opened);
  const offers = useStore<Offers>(ahpPaths(host).offers) ?? NO_OFFERS;
  const manifest = offers.providers[COMPUTER_PROVIDER]?.manifest;
  const picking = embedMode() === 'multi' && hosts.length > 1;
  // The host and the name first, in the same form as the manifest's fields; neither is sent in the body.
  const schema = useMemo<JsonSchemaObject>(() => ({
    type: 'object',
    properties: {
      ...(picking ? { host: { type: 'string', title: t('computers/new/host'), enum: hosts, 'x-enumOptions': hosts.map((one) => ({ value: one, label: hostName(one) })) } } : {}),
      name: { type: 'string', title: t('computers/new/name'), description: t('computers/new/nameHint') },
      ...formSchema(manifest).properties,
    },
  }), [picking, hosts, hostName, manifest, t]);
  const [values, setValues] = useState<Record<string, unknown>>({ host: opened });
  const name = typeof values.name === 'string' ? values.name : '';
  // Another host has its own manifest: its answers start again, the name stays.
  const change = (next: Record<string, unknown>): void => {
    if (typeof next.host === 'string' && next.host !== host) {
      setHost(next.host);
      writeLastHost(next.host);
      setValues({ host: next.host, name: next.name });
      return;
    }
    setValues(next);
  };
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  if (!may(offers, 'write')) return <PageAlert tone="warning" message={t('computers/new/noCreate')} />;
  const problem = nameProblem(name);
  const create = (): void => {
    setBusy(true);
    setFailure(null);
    const made = name.trim();
    const { name: _name, host: _host, ...answers } = values;
    void createComputer(host, offers, made, manifestBody(answers)).then(
      () => {
        scena.surfaces.close('computer:new');
        void scena.commands.execute('ahp.openComputer', { host, id: made });
      },
      (error: unknown) => {
        setFailure(error instanceof Error ? error.message : String(error));
        setBusy(false);
      },
    );
  };

  return (
    <div className="web-page web-form">
      <Text variant="h2" text={t('computers/commands/new')} />
      <SchemaForm
        schema={schema}
        value={values}
        onChange={change}
        errors={problem === undefined || problem === 'nameEmpty' ? {} : { name: t(`computers/new/${problem}`) }}
        jsonTextRoot={false}
      />
      {failure === null ? null : <PageAlert tone="danger" message={failure} />}
      <div className="web-page__actions">
        <Button label={t('computers/new/create')} variant="primary" disabled={problem !== undefined || busy} onClick={create} />
        <Button label={t('computers/new/cancel')} onClick={() => scena.surfaces.close('computer:new')} />
      </div>
    </div>
  );
}
