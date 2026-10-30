import { describe, expect, it } from 'vitest';
import type { Customization } from '@microsoft/agent-host-protocol';
import { customAgents } from './custom-agents.js';

const child = (type: string, uri: string, more: Record<string, unknown> = {}) => ({ id: uri, type, uri, name: uri.split('/').pop(), ...more });
const plugin = (children: unknown[], more: Record<string, unknown> = {}) => ({ id: 'p', type: 'plugin', uri: 'plugin://p', name: 'p', children, ...more }) as unknown as Customization;

describe('customAgents', () => {
  it('finds nothing in an empty tree', () => {
    expect(customAgents(undefined)).toEqual([]);
    expect(customAgents([])).toEqual([]);
  });

  it('lists the agents of two containers in order, with their descriptions', () => {
    const tree = [plugin([child('agent', 'file:///a/reviewer.md', { description: 'Reviews a diff' })]), plugin([child('agent', 'file:///b/writer.md')])];
    expect(customAgents(tree)).toEqual([
      { uri: 'file:///a/reviewer.md', name: 'reviewer.md', description: 'Reviews a diff' },
      { uri: 'file:///b/writer.md', name: 'writer.md' },
    ]);
  });

  it('skips a disabled agent, an agent of a disabled container, and a skill', () => {
    const tree = [
      plugin([child('agent', 'file:///off.md', { enabled: false }), child('skill', 'file:///skill.md'), child('agent', 'file:///on.md')]),
      plugin([child('agent', 'file:///hidden.md')], { enablement: [{ enabled: false }] }),
    ];
    expect(customAgents(tree).map((one) => one.uri)).toEqual(['file:///on.md']);
  });

  it('drops a repeated uri', () => {
    const tree = [plugin([child('agent', 'file:///a.md')]), plugin([child('agent', 'file:///a.md')])];
    expect(customAgents(tree)).toHaveLength(1);
  });
});
