import { expect, test } from 'vitest';
import { serverInfoOf, serverLabel } from './server-info.js';

const answer = { jsonrpc: '2.0', id: 1, result: { protocolVersion: '1.0.0', serverInfo: { name: 'ahpd', version: '0.10.0' }, snapshots: [] } };

test('an initialize answer gives its serverInfo, as an object or as text', () => {
  expect(serverInfoOf(answer)).toEqual({ name: 'ahpd', version: '0.10.0' });
  expect(serverInfoOf(JSON.stringify(answer))).toEqual({ name: 'ahpd', version: '0.10.0' });
});

test('an answer without serverInfo, a notification and bad text give null', () => {
  expect(serverInfoOf({ jsonrpc: '2.0', id: 1, result: { protocolVersion: '1.0.0' } })).toBeNull();
  expect(serverInfoOf({ jsonrpc: '2.0', method: 'action', params: { serverInfo: { name: 'x' } } })).toBeNull();
  expect(serverInfoOf('{not json')).toBeNull();
});

test('a serverInfo without a version is named alone', () => {
  const info = serverInfoOf({ id: 1, result: { serverInfo: { name: 'VS Code' } } });
  expect(info).toEqual({ name: 'VS Code', version: null });
  expect(serverLabel(info!)).toBe('VS Code');
  expect(serverLabel({ name: 'ahpd', version: '0.10.0' })).toBe('ahpd 0.10.0');
});
