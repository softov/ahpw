import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { Alert, Button, SchemaForm, Spinner, Text, type JsonSchemaObject } from '@softov/scena/ui';
import { rootReducer, type RootState, type StateAction } from '@microsoft/agent-host-protocol';
import { ROOT, dispatch } from '../connection/data.js';
import { useChannel } from '../connection/channel.js';
import { changedKeys } from './config.js';

/** The host's settings, as the schema it publishes describes them. */
export default function SettingsPage(): ReactElement {
  const { state, error } = useChannel<RootState>(ROOT, rootReducer);
  const config = state?.config;
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [saved, setSaved] = useState(false);
  const held = useMemo(() => config?.values ?? {}, [config]);

  // What the host holds, again whenever it changes.
  useEffect(() => {
    setValues(held);
  }, [held]);

  if (error !== null) return <Alert tone="danger" title="Settings not readable" message={error} />;
  if (state === undefined) return <Spinner label="Reading the settings" />;
  if (config === undefined) return <Alert tone="info" message="This host publishes no settings." />;

  const changed = changedKeys(held, values);
  const dirty = Object.keys(changed).length > 0;
  const save = (): void => {
    dispatch(ROOT, { type: 'root/configChanged', config: changed } as StateAction);
    setSaved(true);
  };
  return (
    <div className="web-page">
      <Text variant="h2" text="Host settings" />
      <SchemaForm schema={config.schema as unknown as JsonSchemaObject} value={values} onChange={(next) => { setValues(next); setSaved(false); }} baseline={held} />
      <div className="web-page__actions">
        <Button label="Save" variant="primary" disabled={!dirty} onClick={save} />
        <Button label="Reset" disabled={!dirty} onClick={() => setValues(held)} />
        {saved && !dirty ? <span className="web-note">Saved.</span> : null}
      </div>
    </div>
  );
}
