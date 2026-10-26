import { describe, expect, it } from 'vitest';
import type { PluginRow } from '../../bridges/plugins.js';
import { entryKeyOf, pluginRows, type PluginEntry, type RowWords } from './rows.js';

const entry = (id: string, row: Partial<PluginRow>): PluginEntry => ({ host: 'h', hostName: 'dev', id, row: { spec: id, name: id, state: 'ready', ...row } });

const WORDS: RowWords = { multi: false, state: (state) => state, loadFailed: 'Did not load', failing: 'Has errors', category: (category) => (category === '' ? 'Other' : category), menu: () => [] };

describe('pluginRows', () => {
  it('carries the manifest\'s icons on its row', () => {
    const icons = [{ src: 'data:image/png;base64,AAAA' }];
    const rows = pluginRows([entry('drawn', { manifest: { icons } }), entry('plain', {})], 'state', WORDS);
    expect(rows.map((one) => one.icons)).toEqual([icons, undefined]);
    expect(rows.every((one) => one.emoji !== undefined)).toBe(true);
  });

  it('puts problems first and disabled plugins last, by state', () => {
    const rows = pluginRows([
      entry('off', { state: 'disabled' }),
      entry('fine', { state: 'ready' }),
      entry('gone', { state: 'missing' }),
      entry('needs', { state: 'unconfigured' }),
      entry('broken', { state: 'error' }),
    ], 'state', WORDS);
    expect(rows.map((one) => one.title)).toEqual(['broken', 'gone', 'needs', 'fine', 'off']);
    expect(rows.map((one) => one.dot)).toEqual(['failed', 'failed', 'attention', 'ok', 'off']);
  });

  it('shows a plugin under each of its categories, and one with none under Other', () => {
    const rows = pluginRows([
      entry('bot', { manifest: { categories: ['channel', 'agent'] } }),
      entry('plain', {}),
      entry('odd', { manifest: { categories: ['zeta'] } }),
    ], 'category', WORDS);
    expect(rows.map((one) => `${one.group?.label}:${one.title}`)).toEqual(['agent:bot', 'channel:bot', 'zeta:odd', 'Other:plain']);
    expect(new Set(rows.map((one) => one.key)).size).toBe(rows.length);
    expect(rows.map((one) => entryKeyOf(one.key))).toEqual(['h\u0000bot', 'h\u0000bot', 'h\u0000odd', 'h\u0000plain']);
  });

  it('names the id under a title, and the problem on its own line', () => {
    const [row] = pluginRows([entry('webhook', { title: 'Webhooks', state: 'error', problem: 'cannot read', manifest: { categories: ['connector'] } })], 'state', WORDS);
    expect(row?.title).toBe('Webhooks');
    expect(row?.lines).toEqual(['webhook \u{00B7} connector', 'cannot read']);
  });

  it('shows the version, and a failed load over the configured state', () => {
    const alerts = [{ level: 'warning' as const, text: 'no logo' }, { level: 'error' as const, text: 'apply threw' }];
    const [row] = pluginRows([entry('bot', { version: '0.14.0', loaded: false, alerts })], 'state', WORDS);
    expect(row?.lines).toEqual(['0.14.0', 'apply threw']);
    expect(row?.dot).toBe('failed');
    expect(row?.dotLabel).toBe('Did not load');
  });

  it('marks a running plugin with an error, and not one with warnings alone', () => {
    const [failing, warned] = pluginRows([
      entry('a', { loaded: true, alerts: [{ level: 'error', text: 'lost the database' }] }),
      entry('b', { loaded: true, alerts: [{ level: 'warning', text: 'no logo' }] }),
    ], 'state', WORDS);
    expect([failing?.dot, failing?.dotLabel]).toEqual(['failed', 'Has errors']);
    expect([warned?.dot, warned?.lines]).toEqual(['ok', []]);
  });

  it('starts a row with the host name in a window with every host', () => {
    const [row] = pluginRows([entry('bot', {})], 'state', { ...WORDS, multi: true });
    expect(row?.lines[0]).toBe('dev');
  });
});
