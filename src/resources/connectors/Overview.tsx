import type { ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Badge, Button, DetailList, Text, type DetailItem } from '@softov/scena/ui';
import { receiveUrl, type AdapterRow, type ConnectorRow } from '../../bridges/connectors.js';
import { ahpPaths, httpRoot } from '../../bridges/data.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import { embedMode } from '../../shell/embed/index.js';
import { HostIcon } from '../../shell/HostIcon.js';
import { HostTag } from '../../shell/explorer/HostLines.js';
import { done } from '../../shell/notify/index.js';
import { meOn, ownerWord } from './actions.js';
import { inputsOf } from './inputs.js';

/** The capability types ahpd names; another is shown by its title alone. */
const KNOWN_TYPES = ['receive', 'command', 'action', 'ui'];

/**
 * What a connector is: its adapter and the plugin that offers it, whose it
 * is, its state, and what its adapter declares it does. An adapter no plugin
 * registers now is named by its name. A capability that receives shows the
 * URL its calls go to, to copy into the sender.
 */
export function Overview({ host, row, adapter }: { host: string; row: ConnectorRow; adapter: AdapterRow | undefined }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const offers = useStore<Offers>(ahpPaths(host).offers) ?? NO_OFFERS;
  const plugin = adapter?.plugin;
  const facts: DetailItem[] = [
    ...(embedMode() === 'multi' ? [{ label: t('common/host'), value: <HostTag host={host} />, span: true }] : []),
    { label: t('connectors/page/id'), value: row.id },
    { label: t('connectors/page/state'), value: t(`connectors/states/${row.state}`) },
    {
      label: t('connectors/page/adapter'),
      value: adapter === undefined
        ? (row.adapter === undefined ? t('connectors/page/noAdapterShort') : t('connectors/page/unknownAdapter', { adapter: row.adapter }))
        : <span className="web-host-label"><HostIcon icons={adapter.icons} size={16} />{adapter.title}</span>,
    },
    { label: t('connectors/page/owner'), value: ownerWord(t, row.owner, meOn(offers)) },
    ...(plugin === undefined ? [] : [{
      label: t('connectors/page/plugin'),
      value: <button type="button" className="web-link" onClick={() => void scena.commands.execute('ahp.openPlugin', { host, id: plugin })}>{plugin}</button>,
    }]),
  ];
  const capabilities = adapter?.capabilities ?? [];
  const root = httpRoot(host);
  const copy = (url: string): void => {
    void navigator.clipboard?.writeText(url).then(() => done(t('connectors/page/copied')), () => undefined);
  };

  return (
    <div className="web-connector__overview">
      {adapter === undefined || adapter.description === '' ? null : <p>{adapter.description}</p>}
      <DetailList items={facts} columns={2} />
      <Text variant="h3" text={t('connectors/page/capabilities', { count: capabilities.length })} />
      {capabilities.length === 0 ? <p className="web-note">{t('connectors/page/noCapabilities')}</p> : (
        <div className="web-connector__capabilities">
          {capabilities.map((one) => {
            const url = root === undefined ? undefined : receiveUrl(root, one, row.id);
            const inputs = inputsOf(one.input);
            return (
              <details key={`${one.type}:${one.name}`} className="web-connector__capability">
                <summary>
                  {one.title}
                  <Badge text={KNOWN_TYPES.includes(one.type) ? t(`connectors/capabilities/${one.type}`) : one.type} />
                </summary>
                {one.description === '' ? null : <p className="web-connector__capability-text">{one.description}</p>}
                {url === undefined ? null : (
                  <div className="web-connector__url">
                    <code aria-label={t('connectors/page/url')}>{url}</code>
                    <Button size="sm" label={t('connectors/page/copy')} onClick={() => copy(url)} />
                  </div>
                )}
                {inputs.length === 0 ? null : (
                  <dl className="web-connector__inputs" aria-label={t('connectors/page/input')}>
                    {inputs.map((input) => (
                      <div key={input.name} className="web-connector__input">
                        <dt>
                          <code>{input.name}</code>
                          {input.required ? <span className="web-connector__required" title={t('connectors/page/required')}>*</span> : null}
                          {input.type === undefined ? null : <span className="web-connector__type">{input.type}</span>}
                        </dt>
                        {input.description === undefined ? null : <dd>{input.description}</dd>}
                      </div>
                    ))}
                  </dl>
                )}
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}
