import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { useI18n } from '@softov/scena/react';
import { Button, SchemaForm, Spinner, Text, type JsonSchemaObject } from '@softov/scena/ui';
import { rootReducer, type RootState, type StateAction } from '@microsoft/agent-host-protocol';
import { ROOT, dispatch } from '../../bridges/data.js';
import { useChannel } from '../../bridges/channel.js';
import { changedKeys } from './config.js';
import { PageAlert } from '../../shell/view/PageAlert.js';
import { JsonCodeEditor } from '../editor/JsonCodeEditor.js';

/** The host's settings, as the schema it publishes describes them. */
export default function SettingsPage(): ReactElement {
  const { t } = useI18n();
  const { state, error } = useChannel<RootState>(ROOT, rootReducer);
  const config = state?.config;
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [saved, setSaved] = useState(false);
  // While the JSON text does not parse, the form holds the last value that did; Save waits for it.
  const [jsonValid, setJsonValid] = useState(true);
  const held = useMemo(() => config?.values ?? {}, [config]);

  // What the host holds, again whenever it changes.
  useEffect(() => {
    setValues(held);
  }, [held]);

  if (error !== null) return <PageAlert tone="danger" title={t('host/settings/unreadable')} message={error} />;
  if (state === undefined) return <Spinner label={t('host/settings/reading')} />;
  if (config === undefined) return <PageAlert tone="info" message={t('host/settings/none')} />;

  const changed = changedKeys(held, values);
  const dirty = Object.keys(changed).length > 0;
  const save = (): void => {
    dispatch(ROOT, { type: 'root/configChanged', config: changed } as StateAction);
    setSaved(true);
  };
  return (
    <div className="web-page">
      <Text variant="h2" text={t('host/settings/title')} />
      <SchemaForm schema={config.schema as unknown as JsonSchemaObject} value={values} onChange={(next) => { setValues(next); setSaved(false); }} baseline={held} jsonEditor={JsonCodeEditor} onJsonValidChange={setJsonValid} />
      <div className="web-page__actions">
        <Button label={t('host/settings/save')} variant="primary" disabled={!dirty || !jsonValid} {...(jsonValid ? {} : { title: t('host/settings/fixJson') })} onClick={save} />
        <Button label={t('host/settings/reset')} disabled={!dirty} onClick={() => setValues(held)} />
        {saved && !dirty ? <span className="web-note">{t('host/settings/saved')}</span> : null}
      </div>
    </div>
  );
}
