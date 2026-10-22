import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { rootReducer, type RootState, type StateAction } from '@microsoft/agent-host-protocol';
import { useI18n, useScena } from '@softov/scena/react';
import { Button, SchemaForm, Spinner, type JsonSchemaObject } from '@softov/scena/ui';
import { useChannel } from '../../bridges/channel.js';
import { hostBridge, ROOT } from '../../bridges/data.js';
import { PageAlert } from '../../shell/view/PageAlert.js';
import { restartPath } from './state.js';

type Bag = Record<string, unknown>;

const bagOf = (value: unknown): Bag => (typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Bag) : {});

/**
 * A plugin's options, as the host's `plugins.<id>` setting describes them,
 * saved as the settings window saves: one `root/configChanged` the host
 * checks against the same schema. A secret reads `<set>` and is kept unless
 * a new value is typed. The host loads a change at its next start.
 */
export function Options({ host, id }: { host: string; id: string }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const { state, error } = useChannel<RootState>(host, ROOT, rootReducer);
  const key = `plugins.${id}`;
  const config = state?.config;
  const schema = useMemo(() => bagOf(bagOf(bagOf(config?.schema).properties)[key]).properties, [config, key]);
  const optionsSchema = bagOf(bagOf(schema).options) as unknown as JsonSchemaObject;
  const held = useMemo(() => bagOf(bagOf(bagOf(config?.values)[key]).options), [config, key]);
  const [edited, setEdited] = useState<Bag | null>(null);
  const [saved, setSaved] = useState(false);

  // What the host holds now, whenever it changes.
  useEffect(() => setEdited(null), [held]);

  if (error !== null) return <PageAlert tone="danger" title={t('plugins/options/unreadable')} message={error} />;
  if (state === undefined) return <Spinner label={t('plugins/notices/reading')} />;
  if (config === undefined) return <p className="web-note web-plugin__tab">{t('plugins/options/noSettings')}</p>;
  // A plugin that is off, or that did not load, has an empty options schema.
  if (Object.keys(bagOf(optionsSchema.properties)).length === 0) return <p className="web-note web-plugin__tab">{t('plugins/options/none')}</p>;

  const values = edited ?? held;
  const dirty = edited !== null && JSON.stringify(edited) !== JSON.stringify(held);
  const save = (): void => {
    hostBridge(host).dispatch(ROOT, { type: 'root/configChanged', config: { [key]: { options: values } } } as StateAction);
    // The host loads options at its next start.
    scena.store.set(restartPath(host), true);
    setSaved(true);
  };

  return (
    <div className="web-plugin__tab">
      <SchemaForm schema={optionsSchema} value={values} baseline={held} onChange={(next) => { setEdited(next); setSaved(false); }} />
      <div className="web-page__actions">
        <Button label={t('plugins/options/save')} variant="primary" disabled={!dirty} onClick={save} />
        <Button label={t('plugins/options/reset')} disabled={!dirty} onClick={() => setEdited(null)} />
        {saved && !dirty ? <span className="web-note">{t('plugins/options/saved')}</span> : null}
      </div>
    </div>
  );
}
