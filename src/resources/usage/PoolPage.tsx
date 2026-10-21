import { useEffect, useState, type ReactElement } from 'react';
import { getLocale } from '@softov/scena';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Button, DetailList, Spinner, Text } from '@softov/scena/ui';
import { ahpPaths } from '../../bridges/data.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import { personUri } from '../../bridges/people.js';
import { poolOwner, totalWords, usagePeriods, usageRange, usageRecords, type DayRange, type PoolOwner, type UsageEntry, type UsagePeriods, type UsageTotal } from '../../bridges/usage.js';
import { embedMode } from '../../shell/embed/index.js';
import { HostTag } from '../../shell/explorer/HostLines.js';
import { PageAlert } from '../../shell/view/PageAlert.js';
import { timeOf } from '../automations/words.js';
import { EMOJIcon } from '../emojis.js';
import { monthSoFar, USAGE_ASKED } from './state.js';
import { hoursWord, tokensWord, totalLine } from './words.js';

/** What a pool's range reads: its total and the records behind it. */
interface Ranged {
  total: UsageTotal;
  records: UsageEntry[];
}

/** A record's measure: a model call's tokens, cache included, or a computer's hours. */
function measureOf(record: UsageEntry): string {
  if (record.kind === 'computer') return hoursWord(record.seconds / 3600);
  const { input = 0, output = 0, cache } = record.model;
  return tokensWord(input + output + (cache?.read ?? 0) + (cache?.write ?? 0));
}

/** A record's cost, when it was charged one in US dollars, the currency the totals add. */
function costOf(record: UsageEntry): string | undefined {
  return record.cost?.currency.toLowerCase() === 'usd' ? totalWords({ usd: record.cost.amount }, getLocale()).cost : undefined;
}

/** The command that opens an owner's page, and the icon its list shows it with. */
const OWNERS: Record<PoolOwner['domain'], { open: string; icon: string }> = {
  users: { open: 'ahp.openUser', icon: EMOJIcon.users },
  teams: { open: 'ahp.openTeam', icon: EMOJIcon.teams },
  projects: { open: 'ahp.openProject', icon: EMOJIcon.teams },
};

/**
 * One pool: what it was charged today, this week and this month, over a range
 * of days, and the records behind that range, newest first, each opening the
 * session it was charged in.
 */
export default function UsagePoolPage({ host, pool }: { host: string; pool: string }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const offers = useStore<Offers>(ahpPaths(host).offers) ?? NO_OFFERS;
  const asked = useStore<number>(USAGE_ASKED) ?? 0;
  const [range, setRange] = useState<Required<DayRange>>(() => monthSoFar(new Date()));
  const [periods, setPeriods] = useState<UsagePeriods | null>(null);
  const [ranged, setRanged] = useState<Ranged | null>(null);
  const [error, setError] = useState<string | null>(null);
  const said = (caught: unknown): string => (caught instanceof Error ? caught.message : String(caught));

  useEffect(() => {
    let live = true;
    usagePeriods(host, offers, pool).then((held) => { if (live) setPeriods(held); }, (caught: unknown) => { if (live) setError(said(caught)); });
    return () => { live = false; };
  }, [host, offers, pool, asked]);

  useEffect(() => {
    let live = true;
    setRanged(null);
    Promise.all([usageRange(host, offers, pool, range), usageRecords(host, offers, pool, range)]).then(
      ([total, records]) => { if (live) setRanged({ total, records }); },
      (caught: unknown) => { if (live) setError(said(caught)); },
    );
    return () => { live = false; };
  }, [host, offers, pool, range, asked]);

  if (error !== null) return <PageAlert tone="danger" title={t('usage/notices/none')} message={error} />;
  if (periods === null) return <Spinner label={t('usage/notices/reading')} />;
  const nothing = t('usage/explorer/nothing');
  const owner = poolOwner(pool);
  const name = periods.name || pool;

  return (
    <div className="web-page">
      {/* A person's, team's or project's pool names it as its own page does, and opens that page. */}
      {owner === undefined ? <Text variant="h2" text={`${EMOJIcon.usage} ${name}`} /> : (
        <div className="web-role__title">
          <button type="button" className="web-pool__owner" title={t('usage/pool/openOwner', { name })} onClick={() => void scena.commands.execute(OWNERS[owner.domain].open, { host, id: owner.id })}>
            <Text variant="h2" text={`${OWNERS[owner.domain].icon} ${name}`} />
          </button>
          <span className="web-role__uri" title={pool}>{personUri(offers, owner.domain, owner.id)}</span>
        </div>
      )}
      {owner === undefined ? <p className="web-note">{pool}</p> : null}
      <DetailList
        items={[
          ...(embedMode() === 'multi' ? [{ label: t('common/host'), value: <HostTag host={host} />, span: true }] : []),
          ...(['day', 'week', 'month'] as const).map((period) => ({ label: t(`usage/period/${period}`), value: totalLine(periods[period]) || nothing })),
        ]}
      />

      <Text variant="h3" text={`${EMOJIcon.filter} ${t('usage/pool/range')}`} />
      <div className="web-spend__range">
        <input className="web-field" type="date" value={range.from} max={range.until} aria-label={t('usage/range/from')} onChange={(event) => { if (event.target.value !== '') setRange({ ...range, from: event.target.value }); }} />
        <span aria-hidden="true">{'\u{2013}'}</span>
        <input className="web-field" type="date" value={range.until} min={range.from} aria-label={t('usage/range/until')} onChange={(event) => { if (event.target.value !== '') setRange({ ...range, until: event.target.value }); }} />
      </div>
      {ranged === null ? <Spinner label={t('usage/notices/reading')} /> : (
        <>
          <p>{totalLine(ranged.total) || nothing}</p>
          <Text variant="h3" text={`${EMOJIcon.records} ${t('usage/pool/records')}`} />
          {ranged.records.length === 0 ? <p className="web-note">{t('usage/pool/noRecords')}</p> : (
            <ul className="web-spend__records">
              {ranged.records.map((record, at) => {
                const cost = costOf(record);
                const what = record.kind === 'model' ? record.model.name : record.computer;
                return (
                  <li key={`${record.at}\u{0000}${String(at)}`} className="web-spend__record">
                    <span className="web-spend__when">{timeOf(record.at)}</span>
                    <span className="web-spend__what" title={what}>{what}</span>
                    <span className="web-spend__measure">{measureOf(record)}</span>
                    <span className="web-spend__cost">{cost ?? ''}</span>
                    {record.session === undefined ? <span /> : (
                      <Button label={t('usage/pool/openSession')} size="sm" onClick={() => void scena.commands.execute('ahp.openSession', { host, resource: record.session })} />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
