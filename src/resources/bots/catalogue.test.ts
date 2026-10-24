import { describe, expect, it } from 'vitest';
import { botsReducer, readBotChat, servesBotChats, type BotRecord, type BotsState } from './catalogue.js';
import { draftOf, freshLook, parseLabels, recordBody } from './draft.js';

const bot = (id: string, extra: Partial<BotRecord> = {}): BotRecord => ({
  id, name: id, labels: [], body: 'robot', color: 'blue', workspace: `/bots/${id}`, owner: 'user:me',
  createdAt: '2026-10-16T10:00:00Z', updatedAt: '2026-10-16T10:00:00Z', ...extra,
});

describe('botsReducer', () => {
  it('adds and changes a bot in slug order, and removes one by id', () => {
    let state: BotsState = { bots: [bot('b')] };
    state = botsReducer(state, { type: 'x-ahpd-bots/added', bot: bot('a') });
    state = botsReducer(state, { type: 'x-ahpd-bots/changed', bot: bot('b', { name: 'Bee' }) });
    expect(state.bots.map((one) => one.name)).toEqual(['a', 'Bee']);
    state = botsReducer(state, { type: 'x-ahpd-bots/removed', id: 'a' });
    expect(state.bots.map((one) => one.id)).toEqual(['b']);
    expect(botsReducer(state, { type: 'other' } as never)).toBe(state);
  });
});

describe('draft', () => {
  it('splits labels, leaving out blanks and repeats', () => {
    expect(parseLabels(' ops, , ops,docs ')).toEqual(['ops', 'docs']);
  });

  it('gives a new bot the colour the fewest bots have', () => {
    const look = freshLook([bot('a', { color: 'red' }), bot('b', { color: '#d7263d' })], () => 0);
    expect(look).toEqual({ body: 'robot', color: '#f26b0f' });
  });

  it('sends the owner and blank-free fields only on create', () => {
    const fresh = { ...draftOf(undefined, []), name: ' Ana ', labels: 'a, b', owner: 'root:h', color: '#2f6fdf', body: 'ghost' };
    expect(recordBody(fresh, true)).toEqual({ name: 'Ana', labels: ['a', 'b'], body: 'ghost', color: 'blue', owner: 'root:h' });
    const edited = { ...draftOf(bot('a', { description: 'old', instructions: 'Be kind.' }), []), description: '' };
    expect(recordBody(edited, false)).toEqual({ name: 'a', labels: [], body: 'robot', color: 'blue', description: '', instructions: 'Be kind.' });
  });
});

describe('bot chats', () => {
  it('runs them only on a host that lists the bot-chat agent', () => {
    expect(servesBotChats(undefined)).toBe(false);
    expect(servesBotChats([{ provider: 'cofold' }])).toBe(false);
    expect(servesBotChats([{ provider: 'cofold' }, { provider: 'bot-chat' }])).toBe(true);
  });

  it('chats in the bot\'s own session on a host without bot chats, and not at all without one', async () => {
    const offers = { methods: [], described: {}, channels: [], providers: {} };
    expect(await readBotChat('h', offers, bot('nimbo', { session: 'cofold:/abc' }), false)).toBe('cofold:/abc');
    expect(await readBotChat('h', offers, bot('nimbo'), false)).toBeNull();
  });
});
