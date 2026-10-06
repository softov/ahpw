import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { useScena, useStore } from '@softov/scena/react';
import { Alert, Badge, Button, Markdown, SchemaForm, Spinner, Text } from '@softov/scena/ui';
import { MANIFEST, runPath, type Run } from '../manifest/data.js';
import { fieldsOf, needsInput, schemaOf } from '../manifest/input.js';
import type { ProgramManifest } from '../manifest/types.js';
import Result from './Result.js';

/** How a run's time is shown. */
const clock = new Intl.DateTimeFormat(undefined, { timeStyle: 'medium' });

/** One command: what it is, its inputs as a form, and its last answer. */
export default function CommandPage({ commandId }: { commandId?: string }): ReactElement {
  const scena = useScena();
  const manifest = useStore<ProgramManifest>(MANIFEST);
  const command = manifest?.commands.find((one) => one.id === commandId);
  const run = useStore<Run>(runPath(commandId ?? ''));
  const [values, setValues] = useState<Record<string, unknown>>({});
  const schema = useMemo(() => (command === undefined ? undefined : schemaOf(command)), [command]);
  const hasFields = command !== undefined && fieldsOf(command).length > 0;

  const execute = (): void => {
    if (command !== undefined) void scena.commands.execute('ahpd.run', { id: command.id, values });
  };

  // A read that takes nothing is run on opening, once.
  useEffect(() => {
    if (command !== undefined && run === undefined && command.http.method === 'GET' && !needsInput(command)) execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [command?.id]);

  if (manifest === undefined) return <Spinner label="Reading the manifest" />;
  if (command === undefined) return <Alert tone="warning" message={`This daemon has no command ${commandId ?? ''}.`} />;

  const reads = command.http.method === 'GET';
  return (
    <div className="web-page">
      <header className="web-page__head">
        <Text variant="h2" text={command.summary} />
        <div className="web-page__route">
          <Badge label={command.http.method} tone={reads ? 'info' : 'warning'} />
          <code>{command.pattern.join(' ')}</code>
        </div>
        {command.description === undefined ? null : <Markdown text={command.description} />}
      </header>

      {hasFields && schema !== undefined ? (
        <SchemaForm key={command.id} schema={schema} value={values} onChange={setValues} jsonTextRoot={false} />
      ) : null}

      <div className="web-page__actions">
        <Button
          label={reads ? 'Run' : command.summary}
          variant="primary"
          disabled={run?.state === 'running'}
          onClick={execute}
        />
        {run !== undefined && run.state !== 'running' ? (
          <Text muted variant="caption" text={`Last run ${clock.format(run.at)}`} />
        ) : null}
      </div>

      {run === undefined ? null
        : run.state === 'running' ? <Spinner label="Running" />
        : run.state === 'failed' ? (
          <Alert tone="danger" title={run.status === 0 ? 'Not sent' : `HTTP ${run.status}`} message={run.message} />
        ) : (
          <Result value={run.data} />
        )}
    </div>
  );
}
