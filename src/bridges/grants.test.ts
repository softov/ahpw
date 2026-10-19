import { expect, test } from 'vitest';
import { dropSubject, grantCatalog, operationState, reached, subjectInfo, subjectsOf, toggleGroup, toggleOperation } from './grants.js';

const BOT = { title: 'Bot', description: 'A bot.', operations: ['get', 'list', 'resolve', 'watch', 'put', 'delete'], groups: { read: ['get', 'list', 'resolve', 'watch'], write: ['put', 'delete'] } };
const catalog = grantCatalog({ 'ahpd.grants': { session: { title: 'Sessions', description: 'S.', operations: ['list', 'state', 'create'], groups: { read: ['list', 'state'], write: ['create'] } }, bot: BOT, broken: 3 } });

test('the catalog is read from the root state, and a host that sends none has an empty one', () => {
  expect(Object.keys(catalog)).toEqual(['session', 'bot']);
  expect(catalog.bot).toEqual(BOT);
  expect(grantCatalog({})).toEqual({});
});

test('a role\'s subjects: the wildcard first, then the catalog\'s order, then the ones the host does not advertise', () => {
  expect(subjectsOf(['plugin:run', 'bot:list', '*:read', 'session:*'], catalog)).toEqual(['*', 'session', 'bot', 'plugin']);
  expect(subjectsOf(['bot:list'], catalog, ['session'])).toEqual(['session', 'bot']);
  expect(subjectInfo('plugin', catalog, ['plugin:run', 'plugin:write', 'plugin:stop'])).toMatchObject({ title: 'plugin', operations: ['run', 'stop'] });
});

test('an operation is granted itself, covered by a group or a wildcard, or not granted', () => {
  const grants = ['bot:list', 'bot:resolve', 'bot:watch', 'bot:write'];
  expect(operationState(grants, 'bot', 'list', BOT)).toEqual({ state: 'on' });
  expect(operationState(grants, 'bot', 'put', BOT)).toEqual({ state: 'implied', by: 'bot:write' });
  expect(operationState(grants, 'bot', 'get', BOT)).toEqual({ state: 'off' });
  expect(operationState(['*:read'], 'bot', 'get', BOT)).toEqual({ state: 'implied', by: '*:read' });
  expect(reached(grants, 'bot', BOT)).toBe(5);
});

test('a click takes a granted operation out, puts an ungranted one in, and splits the group that covers one', () => {
  expect(toggleOperation(['bot:list'], 'bot', 'list', BOT)).toEqual([]);
  expect(toggleOperation([], 'bot', 'get', BOT)).toEqual(['bot:get']);
  expect(toggleOperation(['bot:write'], 'bot', 'put', BOT)).toEqual(['bot:delete']);
  // Every operation: the read group stays whole, the write group loses one.
  expect(toggleOperation(['bot:*'], 'bot', 'delete', BOT)).toEqual(['bot:read', 'bot:put']);
  // A wildcard subject's grant cannot be narrowed for one subject.
  expect(toggleOperation(['*:read'], 'bot', 'get', BOT)).toEqual(['*:read']);
});

test('a group is given or taken away, and a subject goes with all its grants', () => {
  expect(toggleGroup(['bot:list'], 'bot', 'write')).toEqual(['bot:list', 'bot:write']);
  expect(toggleGroup(['bot:write'], 'bot', 'write')).toEqual([]);
  expect(dropSubject(['bot:list', 'session:*', 'bot:write'], 'bot')).toEqual(['session:*']);
});
