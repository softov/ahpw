import { describe, expect, it } from 'vitest';
import { inputsOf } from './inputs.js';

describe('inputsOf', () => {
  it('lists each property with its type, whether it is required and its description', () => {
    expect(inputsOf({
      type: 'object',
      required: ['chat_id'],
      properties: {
        chat_id: { type: 'string', description: 'Where it goes' },
        format: { enum: ['markdown', 'html'] },
        silent: { type: ['boolean', 'null'], title: 'Silent' },
        extra: {},
      },
    })).toEqual([
      { name: 'chat_id', type: 'string', required: true, description: 'Where it goes' },
      { name: 'format', type: 'enum', required: false },
      { name: 'silent', type: 'boolean', required: false, description: 'Silent' },
      { name: 'extra', required: false },
    ]);
  });

  it('answers nothing for no schema or one without properties', () => {
    expect(inputsOf(undefined)).toEqual([]);
    expect(inputsOf({ type: 'object' })).toEqual([]);
  });
});
