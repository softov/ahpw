import { useEffect, useState, type ReactElement } from 'react';
import { useScena, useStore } from '@softov/scena/react';
import { Alert, Badge, Button, DetailList, Spinner, Text } from '@softov/scena/ui';
import { MANIFEST, runPath, type Run } from '../manifest/data.js';
import { itemActionsOf, itemCommandsOf, keyOf, keyValuesOf, removalQuestion, roleOf, rowsOf, rowTitle, type ItemAction } from '../manifest/roles.js';
import type { ProgramManifest } from '../manifest/types.js';
import { runItemAction } from './Items.js';
import Result from './Result.js';

/** A field's value as a line of text. */
const words = (value: unknown): string => (value === null || value === undefined ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value));

/** One item of a list: what the list says of it, what its get answers, and what can be done to it. */
export default function ItemPage({ list, kind, title }: { list?: string; kind?: string; title?: string }): ReactElement {
  const scena = useScena();
  const manifest = useStore<ProgramManifest>(MANIFEST);
  const listed = useStore<Run>(runPath(list ?? ''));
  const [asking, setAsking] = useState<ItemAction | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const key = manifest === undefined || kind === undefined ? undefined : keyOf(manifest, kind);
  const row = (listed?.state === 'done' ? rowsOf(listed.data) ?? [] : []).find((one) => rowTitle(one, key) === title);
  const get = manifest === undefined || kind === undefined ? undefined : itemCommandsOf(manifest, kind).find((one) => roleOf(one) === 'get');
  const getValues = get === undefined || row === undefined ? undefined : keyValuesOf(get, row);
  const got = useStore<Run>(runPath(get?.id ?? ''));

  // The get is asked once the row is known.
  const getKey = getValues === undefined ? '' : JSON.stringify(getValues);
  useEffect(() => {
    if (get !== undefined && getValues !== undefined) void scena.commands.execute('ahpd.run', { id: get.id, values: getValues });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [get?.id, getKey]);

  if (manifest === undefined) return <Spinner label="Reading the manifest" />;
  if (row === undefined) {
    return listed?.state === 'running' ? <Spinner label="Reading the list" /> : <Alert tone="warning" message={`The list no longer has ${kind ?? ''} ${title ?? ''}.`} />;
  }

  const actions = itemActionsOf(manifest, kind ?? '', row);
  const go = (action: ItemAction): void => {
    setAsking(null);
    if (!action.direct) {
      void scena.commands.execute('ahpd.open', { id: action.command.id, values: action.values });
      return;
    }
    setFailure(null);
    void runItemAction(scena, action).then(setFailure);
  };

  return (
    <div className="web-page">
      <header className="web-page__head">
        <Text variant="h2" text={title ?? ''} />
        <div className="web-page__route"><Badge label={kind ?? ''} tone="info" /></div>
      </header>

      <DetailList columns={2} items={Object.entries(row).map(([name, value]) => ({ label: name, value: words(value) }))} />

      <div className="web-page__actions">
        {asking !== null ? (
          <span className="web-result__ask">
            {removalQuestion(asking.command, asking.values)}
            <Button label="Remove" variant="danger" onClick={() => go(asking)} />
            <Button label="Cancel" onClick={() => setAsking(null)} />
          </span>
        ) : actions.map((action) => (
          <Button
            key={action.command.id}
            label={action.command.summary}
            {...(action.command.effect === 'remove' ? { variant: 'danger' as const } : {})}
            onClick={() => (action.command.effect === 'remove' && action.direct ? setAsking(action) : go(action))}
          />
        ))}
      </div>
      {failure === null ? null : <Alert tone="danger" message={failure} />}

      {get === undefined || got === undefined ? null : (
        <>
          <Text variant="h3" text={get.summary} />
          {got.state === 'running' ? <Spinner label="Reading" />
            : got.state === 'failed' ? <Alert tone="danger" message={got.message} />
            : <Result value={got.data} />}
        </>
      )}
    </div>
  );
}
