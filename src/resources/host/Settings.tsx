import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { useI18n, useScena } from '@softov/scena/react';
import { Button, SchemaForm, Spinner, Tabs, fieldsView, jsonView, sectionsView, type JsonSchemaObject } from '@softov/scena/ui';
import { rootReducer, type RootState, type StateAction } from '@microsoft/agent-host-protocol';
import { hostBridge, ROOT } from '../../bridges/data.js';
import { useChannel } from '../../bridges/channel.js';
import { readUi, uiFields, UI_SETTINGS, watchUi, writeUi } from '../../shell/ui-settings/settings.js';
import { changedKeys } from './config.js';
import { interfaceGroups, settingsGroups } from './sections.js';
import { keepSettingsTab, settingsTab, type SettingsPlace } from './place.js';
import { PageAlert } from '../../shell/view/PageAlert.js';
import { JsonCodeEditor } from '../editor/JsonCodeEditor.js';

/**
 * A host's unsaved edits and the view last chosen on each tab, kept while the
 * settings move from one place to another, which mounts the page again, and
 * while the other tab shows.
 */
const drafts = new Map<string, Record<string, unknown>>();
const chosenViews = new Map<string, string>();

/** The UI settings now, again whenever one changes, from the form or from its menu. */
function useUi(): Record<string, string> {
  const scena = useScena();
  const [ui, setUi] = useState(() => readUi(scena));
  useEffect(() => {
    const watching = watchUi(scena, () => setUi(readUi(scena)));
    setUi(readUi(scena));
    return () => watching.dispose();
  }, [scena]);
  return ui;
}

/** The host's settings, as the schema it publishes describes them; they wait for Save. */
function HostSettings({ host }: { host: string }): ReactElement {
  const { t, locale } = useI18n();
  const { state, error } = useChannel<RootState>(host, ROOT, rootReducer);
  const config = state?.config;
  const held = useMemo(() => config?.values ?? {}, [config]);
  // Null shows what the host holds.
  const [edited, setEdited] = useState<Record<string, unknown> | null>(() => drafts.get(host) ?? null);
  const [saved, setSaved] = useState(false);
  // While the JSON text does not parse, the form holds the last value that did; Save waits for it.
  const [jsonValid, setJsonValid] = useState(true);
  const schema = config?.schema as unknown as JsonSchemaObject | undefined;
  // The section titles are translated when the groups are built, so a language switch builds them again.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const views = useMemo(() => (schema === undefined ? [] : [fieldsView, jsonView, sectionsView(settingsGroups(schema))]), [schema, locale]);

  // What the host holds, again whenever it changes; a draft carried in from another place survives the first read.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    drafts.delete(host);
    setEdited(null);
  }, [held, host]);

  const values = edited ?? held;
  const change = (next: Record<string, unknown>): void => {
    drafts.set(host, next);
    setEdited(next);
    setSaved(false);
  };
  const reset = (): void => {
    drafts.delete(host);
    setEdited(null);
  };

  if (error !== null) return <PageAlert tone="danger" title={t('host/settings/unreadable')} message={error} />;
  if (state === undefined) return <Spinner label={t('host/settings/reading')} />;
  if (config === undefined || schema === undefined) return <PageAlert tone="info" message={t('host/settings/none')} />;

  const changed = changedKeys(held, values);
  const dirty = Object.keys(changed).length > 0;
  const save = (): void => {
    hostBridge(host).dispatch(ROOT, { type: 'root/configChanged', config: changed } as StateAction);
    drafts.delete(host);
    setSaved(true);
  };
  return (
    <div className="web-settings__tab">
      <SchemaForm
        schema={schema}
        value={values}
        onChange={change}
        baseline={held}
        jsonEditor={JsonCodeEditor}
        onJsonValidChange={setJsonValid}
        views={views}
        defaultView={chosenViews.get(host) ?? 'sections'}
        onViewChange={(id) => chosenViews.set(host, id)}
        fieldActions
      />
      <div className="web-page__actions">
        <Button label={t('host/settings/save')} variant="primary" disabled={!dirty || !jsonValid} {...(jsonValid ? {} : { title: t('host/settings/fixJson') })} onClick={save} />
        <Button label={t('host/settings/reset')} disabled={!dirty} onClick={reset} />
        {saved && !dirty ? <span className="web-note">{t('host/settings/saved')}</span> : null}
      </div>
    </div>
  );
}

/**
 * The browser's own settings, the same on every host. Each applies as it
 * changes and is kept where its menu keeps it, so there is nothing to save
 * (decision: UI settings have their own tab in the settings window).
 */
function InterfaceSettings(): ReactElement {
  const scena = useScena();
  const { t, locale } = useI18n();
  const ui = useUi();
  const schema = useMemo<JsonSchemaObject>(
    () => ({ type: 'object', properties: uiFields() }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale],
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const views = useMemo(() => [fieldsView, jsonView, sectionsView(interfaceGroups())], [locale]);
  // A key taken out, by its Reset or the JSON view, goes back to its usual value.
  const change = (next: Record<string, unknown>): void => {
    for (const one of UI_SETTINGS) writeUi(scena, one.key, next[one.key]);
  };
  return (
    <div className="web-settings__tab">
      <SchemaForm
        schema={schema}
        value={ui}
        onChange={change}
        baseline={ui}
        jsonEditor={JsonCodeEditor}
        views={views}
        defaultView={chosenViews.get('ui') ?? 'sections'}
        onViewChange={(id) => chosenViews.set('ui', id)}
        fieldActions
      />
      <div className="web-page__actions">
        <span className="web-note">{t('host/settings/ui/atOnce')}</span>
      </div>
    </div>
  );
}

/**
 * The settings: the host's on one tab, the browser's own on the other. The
 * place draws the title and *Open in*: the window on its title bar, a tab as
 * its name and a strip button (`ahp.settings.openIn`).
 */
export default function SettingsPage({ host, place = 'main' }: { host: string; place?: SettingsPlace }): ReactElement {
  const { t } = useI18n();
  return (
    <div className="web-page web-settings" data-place={place}>
      <Tabs
        tabs={[
          { key: 'host', title: t('host/settings/tabs/host'), child: <HostSettings host={host} /> },
          { key: 'ui', title: t('host/settings/tabs/ui'), child: <InterfaceSettings /> },
        ]}
        defaultValue={settingsTab()}
        onChange={keepSettingsTab}
      />
    </div>
  );
}
