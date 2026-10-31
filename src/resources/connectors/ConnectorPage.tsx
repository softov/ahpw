import { useMemo, type ReactElement } from 'react';
import { useI18n, useScena } from '@softov/scena/react';
import { Alert, Badge, Button, Spinner, Tabs, Text, type BadgeTone } from '@softov/scena/ui';
import { useChannel } from '../../bridges/channel.js';
import { ADAPTERS, adaptersReducer, CONNECTORS, connectorsReducer, type AdapterRow, type ConnectorRow, type ConnectorState } from '../../bridges/connectors.js';
import type { PeopleState } from '../../bridges/people.js';
import { PageAlert } from '../../shell/view/PageAlert.js';
import { EMOJIcon } from '../emojis.js';
import { deleteConnector } from './actions.js';
import { ConnectorForm } from './ConnectorForm.js';
import { Models } from './Models.js';
import { Overview } from './Overview.js';
import { connectorTab, connectorTabKey, keepConnectorTabKey } from './state.js';
import { PageTitle } from '../../shell/HostIcon.js';
import { DangerZone } from '../../shell/controls/DangerZone.js';

const TONE: Record<ConnectorState, BadgeTone> = {
  ready: 'success',
  invalid: 'warning',
  unavailable: 'danger',
};

/** One connector: its head with its state, over Overview, Models when its adapter serves models, and Settings with Delete at its bottom. */
export default function ConnectorPage({ host, connector: id }: { host: string; connector: string }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const { state, error } = useChannel<PeopleState<ConnectorRow>>(host, CONNECTORS.channel, connectorsReducer);
  const adapters = useChannel<PeopleState<AdapterRow>>(host, ADAPTERS.channel, adaptersReducer).state;
  const connectors = useMemo(() => (state?.records ?? []).map((one) => one.record), [state]);

  if (error !== null) return <PageAlert tone="danger" title={t('connectors/notices/none')} message={error} />;
  if (state === undefined) return <Spinner label={t('connectors/notices/reading')} />;
  const row = connectors.find((one) => one.id === id);
  if (row === undefined) return <PageAlert tone="warning" message={t('connectors/page/gone')} />;
  const adapter = adapters?.records.find((one) => one.id === row.adapter)?.record;
  const title = row.title || id;
  // The host lists models only for an open connector; one that is not ready has none to show.
  const servesModels = row.state === 'ready' && (adapter?.capabilities ?? []).some((one) => one.type === 'models');
  const chosen = connectorTabKey();

  return (
    <div className="web-page web-connector">
      <div className="web-page__head">
        <PageTitle
          icons={adapter?.icons}
          emoji={EMOJIcon.connectors}
          title={title}
          uri={`${CONNECTORS.channel}${id}`}
          state={<Badge tone={TONE[row.state]} text={t(`connectors/states/${row.state}`)} />}
        />
      </div>
      {row.state === 'ready' ? null : (
        <Alert tone={row.state === 'unavailable' ? 'danger' : 'warning'} message={row.adapter === undefined ? t('connectors/page/noAdapter') : t(`connectors/stateNotes/${row.state}`, { adapter: row.adapter })} />
      )}
      <Tabs
        tabs={[
          { key: 'overview', title: t('connectors/page/overview'), child: <Overview host={host} row={row} adapter={adapter} /> },
          ...(servesModels ? [{ key: 'models', title: t('connectors/page/models'), child: <Models host={host} id={id} /> }] : []),
          { key: 'settings', title: t('connectors/page/settings'), child: (
            <>
              <ConnectorForm host={host} connector={row} />
              <DangerZone
                label={t('connectors/actions/delete')}
                onClick={() => void deleteConnector(host, row).then((gone) => { if (gone) scena.surfaces.close(connectorTab(host, id)); })}
              />
            </>
          ) },
        ]}
        defaultValue={chosen === 'models' && !servesModels ? 'overview' : chosen}
        onChange={keepConnectorTabKey}
      />
    </div>
  );
}
