import { describe, expect, it } from 'vitest';
import type { AdapterRow } from '../../bridges/connectors.js';
import type { ListedUser } from '../../bridges/people.js';
import { adapterGroups, adapterSchema, capabilityGroups, configForForm, configForPut, holds, ID_PATTERN, idFor, ownerChoices, secretFields, slugOf, topSchema } from './form.js';

const SCHEMA = { type: 'object', properties: { bot: { type: 'string' }, secret: { type: 'string', writeOnly: true } }, required: ['secret'] };
const WEBHOOK: AdapterRow = { name: 'webhook', title: 'Webhook', description: 'Calls in.', schema: SCHEMA, capabilities: [], plugin: 'webhook' };
const OWNER_WORDS = { me: 'Me', team: (team: string) => `Team ${team}`, user: (user: string) => `User ${user}`, host: 'The host' };
const TOP_WORDS = { id: 'Id', idHint: '', title: 'Title', titleHint: '', owner: 'Owner' };

const user = (grants: string[], memberships: string[] = []): ListedUser => ({ id: 'ana', grants, memberships } as unknown as ListedUser);
const values = (grants: string[], memberships: string[] = []): string[] =>
  ownerChoices('user:ana', user(grants, memberships), OWNER_WORDS).map((one) => one.value);

describe('topSchema', () => {
  it('draws the title before the id on a new connector', () => {
    const schema = topSchema([{ value: 'host', label: 'The host' }], false, TOP_WORDS);
    expect(Object.keys(schema.properties ?? {})).toEqual(['title', 'id', 'owner']);
    expect(schema.required).toEqual(['id', 'owner']);
  });

  it('leaves the id out once made', () => {
    const schema = topSchema([], true, TOP_WORDS);
    expect(Object.keys(schema.properties ?? {})).toEqual(['title', 'owner']);
  });
});

describe('idFor', () => {
  it('makes a slug of the title, without accents, starting with a letter', () => {
    expect(slugOf('Vendas GPT')).toBe('vendas-gpt');
    expect(slugOf('  Atenção ao Cliente! ')).toBe('atencao-ao-cliente');
    expect(slugOf('2026 Bot')).toBe('bot');
    expect(slugOf('🤖')).toBe('');
  });

  it('takes the adapter name while the title gives none, and skips a taken id', () => {
    expect(idFor('', 'openai', [])).toBe('openai');
    expect(idFor('Vendas GPT', 'openai', ['vendas-gpt'])).toBe('vendas-gpt-2');
    expect(idFor('Vendas', '', [])).toBe('');
  });

  it('keeps every id it makes within the id pattern', () => {
    expect(ID_PATTERN.test(idFor('A'.repeat(80), 'openai', []))).toBe(true);
    expect(ID_PATTERN.test(idFor('x'.repeat(80), 'openai', ['x'.repeat(36)]))).toBe(true);
  });
});

describe('adapterGroups', () => {
  const ai = (name: string, title: string, plugin: string, description = ''): AdapterRow => ({ ...WEBHOOK, name, title, plugin, description });
  const label = (plugin: string): string => ({ host: 'The host', activepieces: 'Activepieces', webhook: 'Webhook' })[plugin] ?? plugin;
  const all = [ai('slack', 'Slack', 'activepieces'), WEBHOOK, ai('openai', 'OpenAI', 'host', 'An OpenAI account.'), ai('airtable', 'Airtable', 'activepieces'), ai('anthropic', 'Anthropic', 'host')];

  it('puts the host first, then plugins by title, each by title', () => {
    expect(adapterGroups(all, label).map((group) => [group.label, group.adapters.map((one) => one.name)])).toEqual([
      ['The host', ['anthropic', 'openai']],
      ['Activepieces', ['airtable', 'slack']],
      ['Webhook', ['webhook']],
    ]);
  });

  it('keeps the adapters whose title, description or plugin holds the search', () => {
    expect(adapterGroups(all, label, 'op').flatMap((group) => group.adapters.map((one) => one.name))).toEqual(['anthropic', 'openai']);
    expect(adapterGroups(all, label, 'account').flatMap((group) => group.adapters.map((one) => one.name))).toEqual(['openai']);
    expect(adapterGroups(all, label, 'ACTIVE').flatMap((group) => group.adapters.map((one) => one.name))).toEqual(['airtable', 'slack']);
  });
});

describe('capabilityGroups', () => {
  const cap = (type: string, title = type): AdapterRow['capabilities'][number] => ({ type, name: type, title, description: '' });
  const ai = (name: string, title: string, plugin: string, capabilities: AdapterRow['capabilities']): AdapterRow => ({ ...WEBHOOK, name, title, plugin, description: '', capabilities });
  const all = [
    ai('openai', 'OpenAI', 'host', [cap('models', 'Serves models')]),
    ai('anthropic', 'Anthropic', 'host', [cap('models', 'Serves models')]),
    ai('slack', 'Slack', 'activepieces', [cap('action'), cap('action'), cap('receive')]),
    ai('hook', 'Hook', 'webhook', [cap('receive')]),
    ai('bare', 'Bare', 'activepieces', []),
  ];
  const words: Record<string, string> = { action: 'Actions', receive: 'Receives' };
  const typeLabel = (type: string, title: string): string => words[type] ?? title;
  const plugin = (one: string): string => ({ host: 'The host', activepieces: 'Activepieces' })[one] ?? one;

  it('puts an adapter under each type it declares, once each, heads an unknown type by the host\'s title, and closes with those that declare none', () => {
    expect(capabilityGroups(all, typeLabel, plugin, 'No capability').map((group) => [group.label, group.adapters.map((one) => one.name)])).toEqual([
      ['Actions', ['slack']],
      ['Receives', ['hook', 'slack']],
      ['Serves models', ['anthropic', 'openai']],
      ['No capability', ['bare']],
    ]);
  });

  it('keeps the adapters whose title, description or plugin holds the search', () => {
    expect(capabilityGroups(all, typeLabel, plugin, 'No capability', 'host').flatMap((group) => group.adapters.map((one) => one.name))).toEqual(['anthropic', 'openai']);
  });

  it('keeps every adapter of a group whose heading or type holds the search, under that group only', () => {
    expect(capabilityGroups(all, typeLabel, plugin, 'No capability', 'models').map((group) => [group.label, group.adapters.map((one) => one.name)])).toEqual([['Serves models', ['anthropic', 'openai']]]);
    expect(capabilityGroups(all, typeLabel, plugin, 'No capability', 'receive').map((group) => [group.label, group.adapters.map((one) => one.name)])).toEqual([['Receives', ['hook', 'slack']]]);
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

  it('offers a root connection the host, then every user and every team', () => {
    expect(ownerChoices(undefined, undefined, OWNER_WORDS).map((one) => one.value)).toEqual(['host']);
    expect(ownerChoices(undefined, undefined, OWNER_WORDS, undefined, { users: ['softov', 'ana'], teams: ['vendas'] })).toEqual([
      { value: 'host', label: 'The host' },
      { value: 'user:ana', label: 'User ana' },
      { value: 'user:softov', label: 'User softov' },
      { value: 'team:vendas', label: 'Team vendas' },
    ]);
  });

  it('keeps the current owner among them', () => {
    expect(ownerChoices('user:ana', user(['connector:put']), OWNER_WORDS, 'user:bo')).toEqual([{ value: 'user:ana', label: 'Me' }, { value: 'user:bo', label: 'User bo' }]);
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
