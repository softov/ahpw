import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NO_OFFERS, type Offers } from './offers.js';
import { readOwnUser, selfId } from './people.js';

const readText = vi.hoisted(() => vi.fn());

vi.mock('./data.js', () => ({ hostBridge: () => ({ readText }) }));

const as = (principal?: string): Offers => ({ ...NO_OFFERS, providers: { user: { title: '', root: 'user://', operations: ['read'] } }, ...(principal === undefined ? {} : { principal }) });

beforeEach(() => {
  readText.mockReset();
});

describe('selfId', () => {
  it('is the id of a person', () => {
    expect(selfId(as('user:ana'))).toBe('ana');
  });

  it('is nobody for the host itself, an empty id, or no principal', () => {
    expect(selfId(as('root:dev'))).toBeUndefined();
    expect(selfId(as('user:'))).toBeUndefined();
    expect(selfId(as())).toBeUndefined();
  });
});

describe('readOwnUser', () => {
  it('reads the person at their own address', async () => {
    readText.mockResolvedValue({ text: JSON.stringify({ id: 'ana', roles: ['ops'], grants: ['proxy:write'] }) });
    await expect(readOwnUser('h', as('user:ana'))).resolves.toEqual({ id: 'ana', roles: ['ops'], grants: ['proxy:write'] });
    expect(readText).toHaveBeenCalledWith('user://ana');
  });

  it('refuses a connection that is not a person, without asking', async () => {
    await expect(readOwnUser('h', as('root:dev'))).rejects.toThrow('not signed in as a person');
    expect(readText).not.toHaveBeenCalled();
  });

  it('refuses an answer that is not a record', async () => {
    readText.mockResolvedValue({ text: '[]' });
    await expect(readOwnUser('h', as('user:ana'))).rejects.toThrow('answered no record');
  });
});
