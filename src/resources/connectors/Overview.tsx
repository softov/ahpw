import type { ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Button, DetailList, Text, type DetailItem } from '@softov/scena/ui';
import { receiveUrl, type AdapterRow, type Capability, type ConnectorRow } from '../../bridges/connectors.js';
import { ahpPaths, httpRoot } from '../../bridges/data.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import { EMOJIcon } from '../emojis.js';
import { embedMode } from '../../shell/embed/index.js';
import { HostIcon } from '../../shell/HostIcon.js';
import { HostTag } from '../../shell/explorer/HostLines.js';
import { done } from '../../shell/notify/index.js';
import { meOn, ownerWord } from './actions.js';
import { inputsOf } from './inputs.js';

/** The capability types ahpd names, in the order their groups show, with each one's icon. Another type is shown by its name, last. */
const KNOWN_TYPES = new Map([
  ['receive', EMOJIcon.receive],
  ['command', EMOJIcon.terminal],
  ['action', EMOJIcon.action],
  ['ui', EMOJIcon.interface],
]);

/** Capabilities grouped by type: the known types in their order, then the others in the order they come. */
function byType(capabilities: readonly Capability[]): { type: string; items: Capability[] }[] {
  const types = [...new Set(capabilities.map((one) => one.type))];
  const order = [...KNOWN_TYPES.keys()];
  const rank = (type: string): number => (order.includes(type) ? order.indexOf(type) : order.length);
  return types
    .sort((a, b) => rank(a) - rank(b))
    .map((type) => ({ type, items: capabilities.filter((one) => one.type === type) }));
}

/** A type's icon; a type ahpd does not name gets the connector's. */
function iconOf(type: string): string {
  return KNOWN_TYPES.get(type) ?? EMOJIcon.connectors;
}

/**
 * One capability as a row: its type's icon, its title over its description,
 * and its name. Open, the description wraps, and below it come the URL its
 * calls go to, when it receives, and the values it takes.
 */
function CapabilityRow({ capability, url }: { capability: Capability; url: string | undefined }): ReactElement {
  const { t } = useI18n();
  const inputs = inputsOf(capability.input);
  const copy = (text: string): void => {
    void navigator.clipboard?.writeText(text).then(() => done(t('connectors/page/copied')), () => undefined);
  };
  return (
    <details className="web-connector__capability">
      <summary>
        <span className="web-connector__capability-icon" aria-hidden="true">{iconOf(capability.type)}</span>
        <span className="web-connector__capability-head">
          <span className="web-connector__capability-title">{capability.title}</span>
          {capability.description === '' ? null : <span className="web-connector__capability-text">{capability.description}</span>}
        </span>
        <code className="web-connector__capability-name">{capability.name}</code>
        <span className="web-connector__caret web-connector__caret--closed" aria-hidden="true">{EMOJIcon.caretRight}</span>
        <span className="web-connector__caret web-connector__caret--open" aria-hidden="true">{EMOJIcon.caretDown}</span>
      </summary>
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
}

/**
 * What a connector is: its adapter and the plugin that offers it, whose it
 * is, its state, and what its adapter declares it does. An adapter no plugin
 * registers now is named by its name. Capabilities are grouped by type.
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

  return (
    <div className="web-connector__overview">
      {adapter === undefined || adapter.description === '' ? null : <p>{adapter.description}</p>}
      <DetailList items={facts} columns={2} />
      <Text variant="h3" text={t('connectors/page/capabilities', { count: capabilities.length })} />
      {capabilities.length === 0 ? <p className="web-note">{t('connectors/page/noCapabilities')}</p> : (
        byType(capabilities).map((group) => (
          <section key={group.type} className="web-connector__group">
            <div className="web-connector__group-head">
              <span aria-hidden="true">{iconOf(group.type)}</span>
              {KNOWN_TYPES.has(group.type) ? t(`connectors/capabilities/${group.type}`) : group.type}
              {` \u{00B7} ${group.items.length}`}
            </div>
            <div className="web-connector__capabilities">
              {group.items.map((one) => (
                <CapabilityRow key={`${one.type}:${one.name}`} capability={one} url={root === undefined ? undefined : receiveUrl(root, one, row.id)} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
