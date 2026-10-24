import { expect, test } from 'vitest';
import { allows, offersOf } from './offers.js';

const manifest = { type: 'object', properties: { image: { type: 'string' } } };

test('the methods, channels and providers ahpd names, as lists', () => {
  const offers = offersOf({
    'ahpd.methods': [
      { method: 'x-ahpd/computers/create', title: 'Create', description: 'Makes a computer.', grant: 'computer:put' },
      { method: 'x-ahpd/computers/start', title: 'Start', grant: 'computer:write' },
    ],
    'ahpd.channels': [{ scheme: 'x-ahpd-computers', title: 'Computers', grant: 'computer:read' }],
    'ahpd.resourceProviders': { computer: { title: 'Computers', root: 'computer://', operations: ['list', 'read', 'put'], manifest } },
  });
  expect(offers).toEqual({
    methods: ['x-ahpd/computers/create', 'x-ahpd/computers/start'],
    described: { 'x-ahpd/computers/create': 'Makes a computer.' },
    channels: ['x-ahpd-computers'],
    providers: { computer: { title: 'Computers', root: 'computer://', operations: ['list', 'read', 'put'], manifest } },
  });
  expect(allows(offers.providers.computer!, 'write')).toBe(true);
  expect(allows(offers.providers.computer!, 'delete')).toBe(false);
});

test('methods and channels as maps, under the bare names an older ahpd sent', () => {
  const offers = offersOf({ methods: { 'x-ahpd/computers/start': {} }, channels: { 'x-ahpd-bots': {} } });
  expect(offers.methods).toEqual(['x-ahpd/computers/start']);
  expect(offers.channels).toEqual(['x-ahpd-bots']);
  expect(offers.described).toEqual({});
});

test('no _meta, or a provider without a root, offers nothing', () => {
  expect(offersOf(undefined)).toEqual({ methods: [], described: {}, channels: [], providers: {} });
  expect(offersOf({ 'ahpd.resourceProviders': { bot: { title: 'Bots' } } }).providers).toEqual({});
});

test('who the connection is, when the host names one', () => {
  expect(offersOf({ 'ahpd.principal': 'user:ana' }).principal).toBe('user:ana');
  expect(offersOf({}).principal).toBeUndefined();
  expect('principal' in offersOf({ 'ahpd.principal': '' })).toBe(false);
});
