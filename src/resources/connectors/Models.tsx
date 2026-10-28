import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react';
import { useI18n } from '@softov/scena/react';
import { Alert, Button, Spinner } from '@softov/scena/ui';
import { readConnectorModels, type ConnectorModels } from '../../bridges/connectors.js';
import { hostSaid } from '../../bridges/said.js';
import { getLocale } from '@softov/scena';
import { plural } from '../../i18n/locales.js';
import { CopyButton } from '../../shell/controls/CopyButton.js';
import { tokens, when } from '../sessions/turn.js';
import { matches, priceLine } from './models.js';

/**
 * The models a provider connector serves, as the host lists them for this
 * reader: a search over a table of the name a caller sends, the provider's
 * name, the context and the price. A model the reader may not call is dimmed.
 */
export function Models({ host, id }: { host: string; id: string }): ReactElement {
  const { t } = useI18n();
  const [read, setRead] = useState<ConnectorModels | undefined>(undefined);
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [query, setQuery] = useState('');

  const load = useCallback((): (() => void) => {
    let live = true;
    setBusy(true);
    setFailure(null);
    readConnectorModels(host, id).then(
      (answer) => { if (live) { setRead(answer); setBusy(false); } },
      (caught: unknown) => { if (live) { setFailure(hostSaid(caught)); setBusy(false); } },
    );
    return () => { live = false; };
  }, [host, id]);
  useEffect(load, [load]);

  const shown = useMemo(() => (read?.models ?? []).filter((one) => matches(one, query)), [read, query]);
  const locale = getLocale();

  if (read === undefined && busy) return <Spinner label={t('connectors/models/reading')} />;
  return (
    <div className="web-connector__models">
      {failure === null ? null : <Alert tone="danger" title={t('connectors/models/failed')} message={failure} />}
      {read === undefined ? null : (
        <>
          <div className="web-connector__models-head">
            <input
              className="web-log__search"
              type="search"
              value={query}
              placeholder={t('connectors/models/search')}
              aria-label={t('connectors/models/search')}
              onChange={(event) => setQuery(event.target.value)}
            />
            <span className="web-note">
              {query === '' ? plural('connectors/models/count', read.models.length) : plural('connectors/models/shown', read.models.length, { shown: shown.length })}
              {read.at === undefined ? null : ` \u{00B7} ${t('connectors/models/at', { when: when(read.at) })}`}
            </span>
            <Button size="sm" label={t('connectors/models/again')} disabled={busy} onClick={() => { load(); }} />
          </div>
          {read.models.length === 0 ? <p className="web-note">{t('connectors/models/none')}</p> : (
            <div className="web-connector__models-table">
              <table className="web-runs web-table">
                <thead>
                  <tr>
                    <th>{t('connectors/models/columns/model')}</th>
                    <th>{t('connectors/models/columns/name')}</th>
                    <th>{t('connectors/models/columns/context')}</th>
                    <th title={t('connectors/models/priceHint')}>{t('connectors/models/columns/price')}</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((model) => (
                    <tr key={model.model} className={model.callable === false ? 'web-connector__model--refused' : undefined} title={model.callable === false ? t('connectors/models/refused') : undefined}>
                      <td>
                        <span className="web-connector__model-name">
                          <code>{model.model}</code>
                          <CopyButton text={model.model} label={t('connectors/models/copy')} />
                        </span>
                      </td>
                      <td>{model.name ?? ''}</td>
                      <td className="web-connector__model-number">{model.context_length === undefined ? '' : tokens(model.context_length)}</td>
                      <td className="web-connector__model-number">{priceLine(model, locale) ?? ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
