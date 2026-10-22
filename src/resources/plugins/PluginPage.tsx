import type { ReactElement } from 'react';
import { rootReducer, type RootState } from '@microsoft/agent-host-protocol';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Alert, Badge, Button, Spinner, Tabs, Text, type BadgeTone } from '@softov/scena/ui';
import { useChannel } from '../../bridges/channel.js';
import { ahpPaths, ROOT } from '../../bridges/data.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import type { PeopleState } from '../../bridges/people.js';
import { PLUGINS, pluginsReducer, restartNeeded, specEnabled, type PluginRow, type PluginState } from '../../bridges/plugins.js';
import { PageAlert } from '../../shell/view/PageAlert.js';
import { EMOJIcon } from '../emojis.js';
import { mayToggle, togglePlugin } from './actions.js';
import { Options } from './Options.js';
import { Overview } from './Overview.js';
import { keepPluginTabKey, pluginTabKey, restartPath } from './state.js';

const TONE: Record<PluginState, BadgeTone> = {
  error: 'danger',
  missing: 'danger',
  incompatible: 'warning',
  unconfigured: 'warning',
  ready: 'success',
  disabled: 'default',
};

/** One of the host's plugins: its head with its state and Enable or Disable, over Overview and Options. */
export default function PluginPage({ host, plugin: id }: { host: string; plugin: string }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const marked = useStore<boolean>(restartPath(host)) === true;
  const offers = useStore<Offers>(ahpPaths(host).offers) ?? NO_OFFERS;
  const plugins = useChannel<PeopleState<PluginRow>>(host, PLUGINS.channel, pluginsReducer);
  // The host marks its root once it holds a change only a restart applies.
  const root = useChannel<RootState>(host, ROOT, rootReducer);

  if (plugins.error !== null) return <PageAlert tone="danger" title={t('plugins/notices/none')} message={plugins.error} />;
  if (plugins.state === undefined) return <Spinner label={t('plugins/notices/reading')} />;
  const row = plugins.state.records.find((one) => one.id === id)?.record;
  if (row === undefined) return <PageAlert tone="warning" message={t('plugins/page/gone')} />;
  const title = row.title ?? id;

  return (
    <div className="web-page web-plugin">
      <div className="web-page__head">
        <div className="web-role__title">
          <Text variant="h2" text={`${EMOJIcon.hostPlugins} ${title}`} />
          {title === id ? null : <span className="web-role__uri">{id}</span>}
          <Badge tone={TONE[row.state]} text={t(`plugins/states/${row.state}`)} />
        </div>
        {mayToggle(offers, row) ? (
          <div className="web-page__actions">
            <Button
              size="sm"
              label={t(specEnabled(row.spec) ? 'plugins/actions/disable' : 'plugins/actions/enable')}
              onClick={() => void togglePlugin(scena.store, host, id, row)}
            />
          </div>
        ) : null}
      </div>
      {restartNeeded(root.state) || marked ? <Alert tone="warning" message={t('plugins/restart')} /> : null}
      <Tabs
        tabs={[
          { key: 'overview', title: t('plugins/page/overview'), child: <Overview host={host} id={id} row={row} /> },
          { key: 'options', title: t('plugins/page/options'), child: <Options host={host} id={id} /> },
        ]}
        defaultValue={pluginTabKey()}
        onChange={keepPluginTabKey}
      />
    </div>
  );
}
