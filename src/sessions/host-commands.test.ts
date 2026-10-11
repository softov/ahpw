import { describe, expect, it } from 'vitest';
import { agentCommands, hostCommands } from './host-commands.js';

describe('hostCommands', () => {
  it('reads the command, its description and hint from the attachment meta', () => {
    const answer = {
      items: [
        { insertText: '/compact', attachment: { _meta: { command: '/compact', description: 'Shorten the context', argumentHint: '[focus]' } } },
        { insertText: '/help' },
        { insertText: '' },
      ],
    };
    expect(hostCommands(answer)).toEqual([
      { insert: '/compact', label: '/compact', detail: 'Shorten the context', hint: '[focus]' },
      { insert: '/help', label: '/help', detail: undefined, hint: undefined },
    ]);
  });

  it('reads an answer with no items as none', () => {
    expect(hostCommands(undefined)).toEqual([]);
  });
});

describe('agentCommands', () => {
  it('writes each skill or command as /name, with its description', () => {
    expect(agentCommands([{ name: 'advisor', description: 'Read tickets' }, { name: 'ship', description: '' }])).toEqual([
      { insert: '/advisor', label: '/advisor', detail: 'Read tickets', hint: undefined },
      { insert: '/ship', label: '/ship', detail: undefined, hint: undefined },
    ]);
  });
});
