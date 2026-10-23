import { useEffect, useState, type ReactElement } from 'react';
import { translate } from '@softov/scena';
import { useI18n, useStore } from '@softov/scena/react';
import { Badge, Button, DetailList, Progress, Spinner, Text, type DetailItem } from '@softov/scena/ui';
import { ahpPaths, hostBridge } from '../../bridges/data.js';
import { useChannel } from '../../bridges/channel.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import { embedMode } from '../../shell/embed/index.js';
import { HostTag } from '../../shell/explorer/HostLines.js';
import { PageAlert } from '../../shell/view/PageAlert.js';
import { timeOf } from '../automations/words.js';
import { act, may } from './actions.js';
import { COMPUTERS, computersReducer, computersRoot, computerUri, factsOf, standingOf, type ComputersState, type MachineFacts, type Standing } from './machines.js';
import { sizeWords, usageOf, type Usage } from './usage.js';
import { EMOJIcon } from '../emojis.js';

type Tone = 'default' | 'success' | 'warning' | 'danger' | 'info';
const TONE: Record<Standing, Tone> = { running: 'success', problem: 'danger', stopped: 'default' };

/** How often a running computer's use is read again. */
const USAGE_EVERY_MS = 5000;

/** What the computer is and is made from, as far as its runtime says. */
function factsList(host: string, facts: MachineFacts): DetailItem[] {
  const items: DetailItem[] = embedMode() === 'multi' ? [{ label: translate('common/host'), value: <HostTag host={host} /> }] : [];
  const add = (key: string, value: string | undefined): void => {
    if (value !== undefined) items.push({ label: translate(`computers/facts/${key}`), value });
  };
  add('image', facts.image);
  add('destination', facts.destination);
  add('command', facts.command);
  add('workdir', facts.workdir);
  add('network', facts.network);
  add('cores', facts.cores === undefined ? undefined : String(facts.cores));
  add('memoryLimit', facts.memoryLimit === undefined ? undefined : sizeWords(facts.memoryLimit));
  add('exitCode', facts.running || facts.exitCode === undefined ? undefined : String(facts.exitCode));
  add('started', facts.startedAt === undefined ? undefined : timeOf(facts.startedAt));
  add('created', facts.created === undefined ? undefined : timeOf(facts.created));
  add('container', facts.containerId?.slice(0, 12));
  add('pid', facts.pid === undefined ? undefined : String(facts.pid));
  return items;
}

/** The use of a running computer: CPU and memory as bars, then processes, network and disk. */
function UsageView({ usage }: { usage: Usage }): ReactElement {
  const { t } = useI18n();
  const items: DetailItem[] = [];
  if (usage.pids !== undefined) items.push({ label: t('computers/usage/pids'), value: String(usage.pids) });
  if (usage.network !== undefined) items.push({ label: t('computers/usage/network'), value: `\u{2193} ${sizeWords(usage.network.rx)} \u{00B7} \u{2191} ${sizeWords(usage.network.tx)}` });
  if (usage.block !== undefined) items.push({ label: t('computers/usage/disk'), value: `\u{2193} ${sizeWords(usage.block.read)} \u{00B7} \u{2191} ${sizeWords(usage.block.write)}` });
  const cpu = Math.round(usage.cpu.percent);
  const memory = Math.round(usage.memory.percent);
  return (
    <div className="web-usage">
      <div className="web-usage__meter">
        <span className="web-usage__label">{usage.cpu.cores === undefined ? t('computers/usage/cpu', { percent: cpu }) : t('computers/usage/cpuOf', { percent: cpu, cores: usage.cpu.cores })}</span>
        <Progress value={Math.min(cpu, 100)} max={100} color={cpu >= 85 ? 'red' : cpu >= 65 ? 'orange' : 'blue'} />
      </div>
      <div className="web-usage__meter">
        <span className="web-usage__label">{t('computers/usage/memory', { used: sizeWords(usage.memory.used), limit: sizeWords(usage.memory.limit), percent: memory })}</span>
        <Progress value={Math.min(memory, 100)} max={100} color={memory >= 85 ? 'red' : memory >= 65 ? 'orange' : 'blue'} />
      </div>
      {items.length === 0 ? null : <DetailList items={items} columns={3} />}
    </div>
  );
}

/** One computer: its state, its use while it runs, its mounts and what it is made from. */
export default function ComputerPage({ host, machine: id }: { host: string; machine?: string }): ReactElement {
  const { t } = useI18n();
  const { state, error } = useChannel<ComputersState>(host, COMPUTERS, computersReducer);
  const offers = useStore<Offers>(ahpPaths(host).offers) ?? NO_OFFERS;
  const entry = state?.records.find((one) => one.id === id);
  const running = entry === undefined ? false : factsOf(entry.record).running;
  const [usage, setUsage] = useState<Usage | null>(null);

  useEffect(() => {
    if (!running || id === undefined) {
      setUsage(null);
      return;
    }
    const uri = `${computerUri(computersRoot(offers), id)}/stats`;
    let live = true;
    const read = (): void => {
      void hostBridge(host).readText(uri).then(({ text }) => { if (live) setUsage(usageOf(text)); }, () => { if (live) setUsage(null); });
    };
    read();
    const timer = window.setInterval(read, USAGE_EVERY_MS);
    return () => {
      live = false;
      window.clearInterval(timer);
    };
  }, [host, id, running, offers]);

  if (error !== null) return <PageAlert tone="danger" title={t('computers/notices/none')} message={error} />;
  if (state === undefined) return <Spinner label={t('computers/notices/reading')} />;
  if (entry === undefined || id === undefined) return <PageAlert tone="warning" message={t('computers/notices/gone')} />;

  const facts = factsOf(entry.record);
  const standing = standingOf(facts);
  const writable = facts.controlled && may(offers, 'write');

  return (
    <div className="web-page">
      <div className="web-page__head">
        <div className="web-role__title">
          <Text variant="h2" text={`${EMOJIcon.computers} ${id}`} />
          <span className="web-role__uri">{computerUri(computersRoot(offers), id)}</span>
          <Badge tone={TONE[standing]} text={facts.oomKilled ? t('computers/standing/oom') : t(`computers/standing/${standing}`)} />
        </div>
        <div className="web-page__actions">
          {writable ? (
            facts.running
              ? <Button label={t('computers/actions/stop')} onClick={() => void act(host, offers, id, 'stop')} />
              : <Button label={t('computers/actions/start')} variant="primary" onClick={() => void act(host, offers, id, 'start')} />
          ) : null}
          {writable && facts.running ? <Button label={t('computers/actions/restart')} onClick={() => void act(host, offers, id, 'restart')} /> : null}
          {facts.controlled && may(offers, 'delete') ? <Button label={t('computers/actions/remove')} onClick={() => void act(host, offers, id, 'remove')} /> : null}
        </div>
      </div>

      {facts.oomKilled ? <PageAlert tone="warning" message={t('computers/notices/oom')} /> : null}

      <DetailList items={factsList(host, facts)} columns={2} />

      {usage === null ? null : (
        <>
          <Text variant="h3" text={t('computers/page/usage')} />
          <UsageView usage={usage} />
        </>
      )}

      {facts.mounts.length === 0 ? null : (
        <>
          <Text variant="h3" text={t('computers/page/mounts')} />
          <ul className="web-mounts">
            {facts.mounts.map((mount) => (
              <li key={`${mount.source}\u{0000}${mount.target}`}>
                <span className="web-method">{mount.source}</span>
                {' \u{2192} '}
                <span className="web-method">{mount.target}</span>
                {mount.readOnly ? <Badge tone="default" text={t('computers/page/readOnly')} /> : null}
              </li>
            ))}
          </ul>
        </>
      )}

      <details className="web-record">
        <summary>{t('computers/page/record')}</summary>
        <pre>{JSON.stringify(entry.record.status, null, 2)}</pre>
      </details>
    </div>
  );
}
