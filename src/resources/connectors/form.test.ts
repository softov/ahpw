import { describe, expect, it } from 'vitest';
import type { AdapterRow } from '../../bridges/connectors.js';
import type { ListedUser } from '../../bridges/people.js';
import { adapterSchema, configForForm, configForPut, holds, ID_PATTERN, ownerChoices, secretFields, topSchema } from './form.js';

const SCHEMA = { type: 'object', properties: { bot: { type: 'string' }, secret: { type: 'string', writeOnly: true } }, required: ['secret'] };
const WEBHOOK: AdapterRow = { name: 'webhook', title: 'Webhook', description: 'Calls in.', schema: SCHEMA, capabilities: [], plugin: 'webhook' };
const OWNER_WORDS = { me: 'Me', team: (team: string) => `Team ${team}`, host: 'The host' };
const TOP_WORDS = { adapter: 'Adapter', id: 'Id', idHint: '', title: 'Title', titleHint: '', owner: 'Owner' };

const user = (grants: string[], memberships: string[] = []): ListedUser => ({ id: 'ana', grants, memberships } as unknown as ListedUser);
const values = (grants: string[], memberships: string[] = []): string[] =>
  ownerChoices('user:ana', user(grants, memberships), OWNER_WORDS).map((one) => one.value);

describe('topSchema', () => {
  it('offers each adapter by its title on a new connector', () => {
    const schema = topSchema([WEBHOOK], [{ value: 'host', label: 'The host' }], false, TOP_WORDS);
    expect(schema.properties?.adapter?.['x-enumOptions']).toEqual([{ value: 'webhook', label: 'Webhook' }]);
    expect(schema.required).toEqual(['adapter', 'id', 'owner']);
  });

  it('leaves the adapter and id out once made', () => {
    const schema = topSchema([WEBHOOK], [], true, TOP_WORDS);
    expect(Object.keys(schema.properties ?? {})).toEqual(['title', 'owner']);
  });
});

describe('ownerChoices', () => {
  it('offers a person with connector:put themself and each team they are on', () => {
    expect(values(['connector:put'], ['ops:*', 'dev', 'ops'])).toEqual(['user:ana', 'team:dev', 'team:ops']);
  });

  it('offers the host only beside connector:host', () => {
    expect(values(['connector:put', 'connector:host'])).toEqual(['user:ana', 'host']);
    expect(values(['connector:host'])).toEqual([]);
  });

  it('offers a person without connector:put nothing, their own included', () => {
    expect(values([], ['ops'])).toEqual([]);
  });

  it('reads `*:*`, `*:<operation>` and `<subject>:*` as holding a grant', () => {
    expect(values(['*:*'])).toEqual(['user:ana', 'host']);
    expect(values(['connector:*'])).toEqual(['user:ana', 'host']);
    expect(values(['*:put'])).toEqual(['user:ana']);
  });

  it('offers a root connection the host alone', () => {
    expect(ownerChoices(undefined, undefined, OWNER_WORDS).map((one) => one.value)).toEqual(['host']);
  });

  it('keeps the current owner among them', () => {
    expect(ownerChoices('user:ana', user(['connector:put']), OWNER_WORDS, 'user:bo')).toEqual([{ value: 'user:ana', label: 'Me' }, { value: 'user:bo', label: 'bo' }]);
  });
});

describe('holds', () => {
  it('is ahpd\'s rule: the grant, or a wildcard in either place', () => {
    expect(holds(['connector:list'], 'connector:list')).toBe(true);
    expect(holds(['connector:all'], 'connector:list')).toBe(false);
  });
});

describe('secrets', () => {
  it('finds writeOnly fields and draws them as passwords, saying a held one is kept', () => {
    expect(secretFields(SCHEMA)).toEqual(['secret']);
    const drawn = adapterSchema(SCHEMA, { secret: { $secret: 'x' } }, 'Kept.');
    expect(drawn.properties?.secret).toMatchObject({ format: 'password', description: 'Kept.' });
    expect(adapterSchema(SCHEMA, {}, 'Kept.').properties?.secret?.description).toBeUndefined();
  });

  it('shows a held secret empty, and sends one left empty as ""', () => {
    expect(configForForm({ bot: 'bot://a', secret: { $secret: 'x' } })).toEqual({ bot: 'bot://a', secret: '' });
    expect(configForPut({ bot: 'bot://a' }, SCHEMA)).toEqual({ bot: 'bot://a', secret: '' });
    expect(configForPut({ secret: 'new' }, SCHEMA)).toEqual({ secret: 'new' });
  });
});

describe('ID_PATTERN', () => {
  it('takes ahpd\'s slugs', () => {
    expect(ID_PATTERN.test('ci-deploys')).toBe(true);
    expect(ID_PATTERN.test('1ci')).toBe(false);
    expect(ID_PATTERN.test('Ci')).toBe(false);
    expect(ID_PATTERN.test('kind:x')).toBe(false);
  });
});
