import { describe, expect, it } from 'vitest';
import type { AdapterRow, ConnectorOwner, ConnectorRow } from '../../bridges/connectors.js';
import { adapterTitle, connectorRows, type ConnectorEntry, type RowWords } from './rows.js';

const ADAPTERS: AdapterRow[] = [
  { name: 'webhook', title: 'Webhook', description: '', schema: {}, capabilities: [], plugin: 'webhook' },
  { name: 'github', title: 'GitHub', description: '', schema: {}, capabilities: [], plugin: 'github' },
];

const row = (id: string, adapter: string | undefined, owner: ConnectorOwner, state: ConnectorRow['state'], title?: string): ConnectorRow =>
  ({ id, owner, state, config: {}, ...(adapter === undefined ? {} : { adapter }), ...(title === undefined ? {} : { title }) });

const entry = (one: ConnectorRow): ConnectorEntry => ({ host: 'h', hostName: 'Host', row: one, adapters: ADAPTERS, me: 'user:ana' });

const WORDS: RowWords = {
  multi: false,
  state: (state) => state,
  owner: (owner, me) => (owner === me ? 'Me' : owner),
  noAdapter: 'No adapter',
  menu: () => [],
};

const ENTRIES = [
  entry(row('ci', 'webhook', 'user:ana', 'ready', 'CI deploys')),
  entry(row('gh', 'github', 'team:ops', 'invalid')),
  entry(row('old', 'gone', 'host', 'unavailable')),
  entry(row('legacy', undefined, 'host', 'unavailable')),
];

const groups = (rows: ReturnType<typeof connectorRows>): string[] => [...new Set(rows.map((one) => one.group?.label))] as string[];

describe('connectorRows', () => {
  it('carries the adapter\'s icons on its row and its adapter group', () => {
    const icons = [{ src: 'data:image/png;base64,AAAA' }];
    const drawn = (one: ConnectorRow): ConnectorEntry => ({ ...entry(one), adapters: [{ ...ADAPTERS[0]!, icons }, ADAPTERS[1]!] });
    const [hook, plain] = connectorRows([drawn(row('a', 'webhook', 'host', 'ready')), drawn(row('b', 'github', 'host', 'ready'))], 'adapter', WORDS)
      .sort((x, y) => x.title.localeCompare(y.title));
    expect([hook?.icons, hook?.group?.icons]).toEqual([icons, icons]);
    expect([plain?.icons, plain?.group?.icons]).toEqual([undefined, undefined]);
    expect(connectorRows([drawn(row('a', 'webhook', 'host', 'ready'))], 'state', WORDS)[0]?.group?.icons).toBeUndefined();
  });

  it('groups by adapter, by the adapters\' titles, names one no plugin registers by its name, and closes with records that name none', () => {
    const rows = connectorRows(ENTRIES, 'adapter', WORDS);
    expect(groups(rows)).toEqual(['GitHub', 'gone', 'Webhook', 'No adapter']);
    expect(rows.find((one) => one.title === 'CI deploys')?.lines).toEqual(['ci \u{00B7} Me']);
  });

  it('groups by owner with the reader first, then teams, then the host', () => {
    const rows = connectorRows(ENTRIES, 'owner', WORDS);
    expect(groups(rows)).toEqual(['Me', 'team:ops', 'host']);
    expect(rows[0]?.lines).toEqual(['ci \u{00B7} Webhook']);
  });

  it('groups by state with problems first, and gives each state its dot', () => {
    const rows = connectorRows(ENTRIES, 'state', WORDS);
    expect(groups(rows)).toEqual(['unavailable', 'invalid', 'ready']);
    expect(rows.map((one) => one.dot)).toEqual(['failed', 'failed', 'attention', 'ok']);
  });

  it('shows the host\'s name first in multi mode', () => {
    const rows = connectorRows([ENTRIES[1]!], 'state', { ...WORDS, multi: true });
    expect(rows[0]?.lines).toEqual(['Host \u{00B7} GitHub \u{00B7} team:ops']);
  });
});

describe('adapterTitle', () => {
  it('is the host\'s title for an adapter, or its name', () => {
    expect(adapterTitle(ADAPTERS, 'webhook')).toBe('Webhook');
    expect(adapterTitle(ADAPTERS, 'gone')).toBe('gone');
  });
});
