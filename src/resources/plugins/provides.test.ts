import { describe, expect, it } from 'vitest';
import { linkOf, providedGroups } from './provides.js';

describe('providedGroups', () => {
  it('leads with agents and adapters, then the rest by name, and leaves empty lists out', () => {
    const groups = providedGroups({ methods: ['x-ahpd/bots/put'], agents: ['claude'], zeta: ['z'], adapters: ['webhook'], ports: [] }, 'h');
    expect(groups.map((one) => one.kind)).toEqual(['agents', 'adapters', 'methods', 'zeta']);
  });

  it('is nothing for a plugin with no contracts', () => {
    expect(providedGroups(undefined, 'h')).toEqual([]);
  });
});

describe('linkOf', () => {
  it('opens an agent page, and a channel or scheme its section', () => {
    expect(linkOf('agents', 'claude', 'h')).toEqual({ command: 'ahp.openAgent', args: { host: 'h', provider: 'claude' } });
    expect(linkOf('channels', 'x-ahpd-bots', 'h')).toEqual({ command: 'ahp.showBots' });
    expect(linkOf('resourceProviders', 'computer', 'h')).toEqual({ command: 'ahp.showComputers' });
  });

  it('opens nothing for a wildcard, or for what ahpw has no place for', () => {
    expect(linkOf('agents', 'claude-*', 'h')).toBeUndefined();
    expect(linkOf('channels', 'x-other', 'h')).toBeUndefined();
    expect(linkOf('methods', 'x-ahpd/bots/put', 'h')).toBeUndefined();
  });
});
