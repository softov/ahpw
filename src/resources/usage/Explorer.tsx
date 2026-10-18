import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { translate } from '@softov/scena';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Spinner } from '@softov/scena/ui';
import { ahpPaths } from '../../bridges/data.js';
import { useHostNames, useShownHosts } from '../../bridges/hosts.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import { useServingHosts } from '../../bridges/served.js';
import {
  periodRange, servesUsage, usageGroups, usagePeriods, usagePools, usageRange,
  type DayRange, type Period, type UsageKey, type UsageTotal,
} from '../../bridges/usage.js';
import { embedMode } from '../../shell/embed/index.js';
import { ExplorerList, type Row } from '../../shell/explorer/ExplorerList.js';
import { ACTIVE_POOL, monthSoFar, USAGE_ASKED, USAGE_GROUP, USAGE_PERIOD, USAGE_RANGE } from './state.js';
import { kindWord, totalLine } from './words.js';

/** One listed line: a pool, or a group of records summed by a key. `pool` is what opens, when there is one. */
interface Item {
  host: string;
  key: string;
  name: string;
  kind: string;
  total: UsageTotal;
  pool?: string;
}

/** What one host answered: its items, or why it did not. */
type Answer = { host: string; items: Item[] } | { host: string; error: string };

/** The groups' order: a host's refusal, then users, teams and projects, then any other kind. */
const ORDER = ['problem', 'user', 'team', 'project'];
const rank = (kind: string | undefined): number => {
  const at = ORDER.indexOf(kind ?? '');
  return at < 0 ? ORDER.length : at;
};

/** No keys: the list shows the pools. One array, so a render with none does not read again. */
const NO_KEYS: readonly UsageKey[] = [];

/** The rows' order: what cost most first, then by name. */
const byCost = (a: Item, b: Item): number => (b.total.usd ?? 0) - (a.total.usd ?? 0) || a.name.localeCompare(b.name);

/**
 * One host's items for the period: its pools with their totals, or its records
 * summed by the keys in `by` together, each named by every key's name. A sum by
 * one key opens that key's pool; a sum by several has none to open.
 */
async function itemsOf(host: string, offers: Offers, period: Period, range: DayRange, by: readonly UsageKey[]): Promise<Item[]> {
  if (by.length > 0) {
    const rows = await usageGroups(host, offers, by, periodRange(period, range, new Date()));
    return rows.map((row) => {
      const pool = by.length === 1 ? row.keys[by[0]!] : undefined;
      return {
        host,
        key: by.map((one) => row.keys[one] ?? '').join('|'),
        name: by.map((one) => row.names[one] ?? row.keys[one] ?? translate('usage/explorer/none')).join(' \u{00B7} '),
        kind: by.join('+'),
        total: row.total,
        ...(pool === undefined ? {} : { pool }),
      };
    });
  }
  const pools = await usagePools(host, offers);
  return Promise.all(pools.map(async (one) => ({
    host,
    key: one.pool,
    name: one.name,
    kind: one.kind,
    pool: one.pool,
    total: period === 'range' ? await usageRange(host, offers, one.pool, range) : (await usagePeriods(host, offers, one.pool))[period],
  })));
}

/**
 * The sidebar: each shown host's usage pools with what they were charged over
 * the chosen period, or the records summed by user, team or project. Usage has
 * no channel, so it asks when it shows, when a choice changes, and on reload.
 */
export default function UsageExplorer(): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const shown = useShownHosts();
  const hosts = useServingHosts(shown, servesUsage);
  const hostName = useHostNames();
  const multi = embedMode() === 'multi';
  const period = useStore<Period | null>(USAGE_PERIOD) ?? 'month';
  const by = useStore<UsageKey[] | null>(USAGE_GROUP) ?? NO_KEYS;
  const range = useStore<Required<DayRange>>(USAGE_RANGE) ?? monthSoFar(new Date());
  const asked = useStore<number>(USAGE_ASKED) ?? 0;
  const active = useStore<{ host: string; pool: string }>(ACTIVE_POOL);
  const [answers, setAnswers] = useState<Answer[] | null>(null);

  useEffect(() => {
    let live = true;
    setAnswers(null);
    void Promise.all(hosts.map(async (host): Promise<Answer> => {
      const offers = scena.store.get<Offers>(ahpPaths(host).offers) ?? NO_OFFERS;
      try {
        return { host, items: await itemsOf(host, offers, period, range, by) };
      } catch (caught) {
        return { host, error: caught instanceof Error ? caught.message : String(caught) };
      }
    })).then((held) => { if (live) setAnswers(held); });
    return () => { live = false; };
  // `range` is a new object each render while none is stored; its days are what matter.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hosts, period, by, range.from, range.until, asked, scena]);

  const rows = useMemo<Row[]>(() => (answers ?? []).flatMap((answer): Row[] => {
    if ('error' in answer) {
      return [{
        key: `problem|${answer.host}`,
        dot: 'failed',
        dotLabel: t('usage/explorer/refused'),
        title: hostName(answer.host),
        group: { key: 'problem', label: t('usage/explorer/refused') },
        lines: [answer.error],
        menu: [],
      }];
    }
    return [...answer.items].sort(byCost).map((item) => ({
      key: `${item.host}|${item.key}`,
      dot: 'quiet',
      dotLabel: item.name,
      title: item.name,
      group: { key: item.kind, label: item.kind.split('+').map(kindWord).join(' \u{00B7} ') },
      lines: [
        totalLine(item.total) || t('usage/explorer/nothing'),
        ...(multi ? [hostName(item.host)] : []),
      ],
      menu: item.pool === undefined ? [] : [{ title: t('usage/actions/open'), onSelect: (menu) => { menu.closeMenu(); void scena.commands.execute('ahp.openUsagePool', { host: item.host, pool: item.pool, name: item.name }); } }],
    }));
  // Rows group by kind, so a kind's rows must come together; a host's refusal first.
  }).sort((a, b) => rank(a.group?.key) - rank(b.group?.key) || (a.group?.key ?? '').localeCompare(b.group?.key ?? '')), [answers, multi, hostName, scena, t]);

  const openable = (key: string): { host: string; pool: string; name: string } | undefined => {
    for (const answer of answers ?? []) {
      if ('error' in answer) continue;
      const item = answer.items.find((one) => `${one.host}|${one.key}` === key);
      if (item?.pool !== undefined) return { host: item.host, pool: item.pool, name: item.name };
    }
    return undefined;
  };

  const notice = hosts.length === 0
    ? <p className="web-note web-explorer__empty">{t('usage/explorer/notServed')}</p>
    : answers === null
      ? <Spinner label={t('usage/notices/reading')} />
      : rows.length === 0 ? <p className="web-note web-explorer__empty">{t('usage/explorer/empty')}</p> : null;

  return (
    <div className="web-spend__side">
      {period === 'range' ? (
        <div className="web-spend__range">
          <input className="web-field" type="date" value={range.from} max={range.until} aria-label={t('usage/range/from')} onChange={(event) => { if (event.target.value !== '') scena.store.set(USAGE_RANGE, { ...range, from: event.target.value }); }} />
          <span aria-hidden="true">{'\u{2013}'}</span>
          <input className="web-field" type="date" value={range.until} min={range.from} aria-label={t('usage/range/until')} onChange={(event) => { if (event.target.value !== '') scena.store.set(USAGE_RANGE, { ...range, until: event.target.value }); }} />
        </div>
      ) : null}
      <ExplorerList
        label={t('usage/explorer/title')}
        rows={rows}
        selected={active === undefined ? null : `${active.host}|${active.pool}`}
        onOpen={(key) => {
          const target = openable(key);
          if (target !== undefined) void scena.commands.execute('ahp.openUsagePool', target);
        }}
        notice={notice}
        filterLabel={t('usage/explorer/filter')}
        hostLines={multi}
      />
    </div>
  );
}
