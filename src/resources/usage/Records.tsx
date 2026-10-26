import { useState, type ReactElement, type ReactNode } from 'react';
import { getLocale } from '@softov/scena';
import { useI18n, useScena } from '@softov/scena/react';
import { Button } from '@softov/scena/ui';
import { totalWords, type UsageEntry } from '../../bridges/usage.js';
import { timeOf } from '../automations/words.js';
import { EMOJIcon } from '../emojis.js';
import { hoursWord } from './words.js';

type Cost = NonNullable<UsageEntry['cost']>;

/** The icon of what wrote a record. */
const SOURCES: Record<UsageEntry['source'], string> = {
  proxy: EMOJIcon.proxy,
  agent: EMOJIcon.agents,
  computer: EMOJIcon.computers,
};

/** The icon of what a record measures. */
const KINDS: Record<UsageEntry['kind'], string> = {
  model: EMOJIcon.model,
  computer: EMOJIcon.period,
};

/** A count of tokens, in full: `193,729`. */
function countWord(n: number): string {
  return n.toLocaleString(getLocale());
}

/** A count of tokens, compact: `193.7K`. */
function compactWord(n: number): string {
  return totalWords({ tokens: n }, getLocale()).tokens ?? String(n);
}

/** An amount of money, to the digits a call's fraction of a cent needs. */
function moneyWord(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(getLocale(), { style: 'currency', currency: currency.toUpperCase(), maximumFractionDigits: 6 }).format(amount);
  } catch {
    // A currency Intl does not know is written as the host sent it.
    return `${String(amount)} ${currency}`;
  }
}

/** A record's cost, when it was charged one in US dollars, the currency the totals add. */
function costOf(record: UsageEntry): string | undefined {
  return record.cost?.currency.toLowerCase() === 'usd' ? moneyWord(record.cost.amount, 'usd') : undefined;
}

/** One group of the details: its fields, each only when the record has it. */
function Group({ title, fields }: { title: string; fields: [string, ReactNode | undefined][] }): ReactElement | null {
  const shown = fields.filter((field): field is [string, ReactNode] => field[1] !== undefined);
  if (shown.length === 0) return null;
  return (
    <section>
      <h4>{title}</h4>
      <dl>
        {shown.map(([label, value]) => [<dt key={`${label}:t`}>{label}</dt>, <dd key={`${label}:d`}>{value}</dd>])}
      </dl>
    </section>
  );
}

/** A chip after a value: where a cost came from, or that a record opens its turn. */
function Chip({ text }: { text: string }): ReactElement {
  return <span className="web-spend__chip">{text}</span>;
}

/**
 * The records of a pool, newest first. A row reads when, what wrote it, what
 * it measures, its tokens or hours, and its cost; a click opens its details.
 */
export function UsageRecords({ host, records }: { host: string; records: readonly UsageEntry[] }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const [open, setOpen] = useState<ReadonlySet<number>>(new Set());
  const toggle = (at: number): void => setOpen((was) => {
    const next = new Set(was);
    if (!next.delete(at)) next.add(at);
    return next;
  });
  const openSession = (session: string): void => void scena.commands.execute('ahp.openSession', { host, resource: session });

  /** A cost with where it came from and its two parts, when it was given them. */
  const costFields = (label: string, cost: Cost | undefined): [string, ReactNode | undefined][] => cost === undefined ? [] : [
    [label, <>{moneyWord(cost.amount, cost.currency)} <Chip text={t(`usage/record/from/${cost.from}`)} /></>],
    [`${EMOJIcon.tokensIn} ${t('usage/record/input')}`, cost.input === undefined ? undefined : moneyWord(cost.input, cost.currency)],
    [`${EMOJIcon.tokensOut} ${t('usage/record/output')}`, cost.output === undefined ? undefined : moneyWord(cost.output, cost.currency)],
  ];

  return (
    <ul className="web-spend__records">
      {records.map((record, at) => {
        const expanded = open.has(at);
        const model = record.kind === 'model' ? record.model : undefined;
        // A model record with no name reads as the agent that wrote it.
        const name = record.kind === 'computer' ? record.computer : (model?.name || undefined);
        const by = model === undefined || name === undefined ? undefined : (record.agent ?? model.provider);
        const cost = costOf(record);
        const sourceWord = t(`usage/record/sources/${record.source}`);
        const kindWord = t(`usage/record/kinds/${record.kind}`);
        const tokens = (icon: string, title: string, n: number | undefined): ReactElement => (
          <span className="web-spend__num" title={title}><b>{icon}</b>{n === undefined ? '\u{2013}' : compactWord(n)}</span>
        );
        const cacheRead = model?.cache?.read;
        const cacheWrite = model?.cache?.write;
        return (
          <li key={`${record.at}\u{0000}${String(at)}`} className="web-spend__record" data-open={expanded ? 'true' : undefined}>
            <div className="web-spend__row" onClick={() => toggle(at)}>
              <button type="button" className="web-spend__caret" aria-expanded={expanded} title={t(expanded ? 'usage/record/hide' : 'usage/record/show')} onClick={(event) => { event.stopPropagation(); toggle(at); }}>
                {expanded ? EMOJIcon.caretDown : EMOJIcon.caretRight}
              </button>
              <span className="web-spend__when">{timeOf(record.at)}</span>
              <span className="web-spend__icons">
                <span title={`${t('usage/record/source')}: ${sourceWord}`}>{SOURCES[record.source]}</span>
                <span title={`${t('usage/record/kind')}: ${kindWord}`}>{KINDS[record.kind]}</span>
              </span>
              <span className="web-spend__what" title={name ?? record.agent}>
                {name === undefined ? <span className="web-spend__fallback">{record.agent ?? '\u{2013}'}</span> : name}
                {by === undefined ? null : <small>{by}</small>}
              </span>
              <span className="web-spend__tokens">
                {record.kind === 'computer' ? (
                  <span className="web-spend__num web-spend__hours" title={t('usage/record/time')}>{hoursWord(record.seconds / 3600)}</span>
                ) : (
                  <>
                    {tokens(EMOJIcon.tokensIn, t('usage/record/input'), model?.input)}
                    {tokens(EMOJIcon.tokensOut, t('usage/record/output'), model?.output)}
                    {tokens(EMOJIcon.cacheRead, t('usage/record/cacheRead'), cacheRead)}
                  </>
                )}
              </span>
              <span className="web-spend__cost">{cost ?? ''}</span>
              {record.session === undefined ? <span /> : (
                <span onClick={(event) => event.stopPropagation()}>
                  <Button label={t('usage/pool/openSession')} size="sm" onClick={() => openSession(record.session!)} />
                </span>
              )}
            </div>
            {expanded ? (
              <div className="web-spend__detail">
                <Group title={t('usage/record/origin')} fields={[
                  [t('usage/record/source'), <>{SOURCES[record.source]} {sourceWord}</>],
                  [t('usage/record/kind'), <>{KINDS[record.kind]} {kindWord}</>],
                  [t('usage/record/model'), model?.name || undefined],
                  [t('usage/record/provider'), model?.provider],
                  [t('usage/record/agent'), record.agent],
                  [t('usage/record/computer'), record.computer],
                  [t('usage/record/owner'), record.owner],
                ]} />
                <Group title={record.kind === 'computer' ? t('usage/record/time') : t('usage/record/tokens')} fields={record.kind === 'computer' ? [
                  [t('usage/record/time'), hoursWord(record.seconds / 3600)],
                ] : [
                  [`${EMOJIcon.tokensIn} ${t('usage/record/input')}`, model?.input === undefined ? undefined : countWord(model.input)],
                  [`${EMOJIcon.tokensOut} ${t('usage/record/output')}`, model?.output === undefined ? undefined : countWord(model.output)],
                  [`${EMOJIcon.cacheRead} ${t('usage/record/cacheRead')}`, cacheRead === undefined ? undefined : countWord(cacheRead)],
                  [`${EMOJIcon.cacheWrite} ${t('usage/record/cacheWrite')}`, cacheWrite === undefined ? undefined : countWord(cacheWrite)],
                ]} />
                <Group title={t('usage/record/cost')} fields={[
                  ...costFields(t('usage/record/charged'), record.cost),
                  ...costFields(t('usage/record/providerCost'), record.providerCost),
                ]} />
                <Group title={t('usage/record/where')} fields={[
                  [t('usage/record/session'), record.session === undefined ? undefined : (
                    <button type="button" className="web-spend__link" title={record.session} onClick={() => openSession(record.session!)}>{record.session}</button>
                  )],
                  [t('usage/record/chat'), record.chat === undefined ? undefined : <span title={record.chat}>{record.chat}</span>],
                  [t('usage/record/turn'), record.turn === undefined ? undefined : (
                    <>{record.turn}{record.kind === 'model' && record.opens === true ? <> <Chip text={t('usage/record/opens')} /></> : null}</>
                  )],
                  [t('usage/record/team'), record.team],
                  [t('usage/record/project'), record.project],
                  [t('usage/record/pools'), record.pools.length === 0 ? undefined : <>{record.pools.map((pool) => <Chip key={pool} text={pool} />)}</>],
                ]} />
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
