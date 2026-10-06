import { describe, expect, it } from 'vitest';
import type { ChatInputQuestion } from '@microsoft/agent-host-protocol';
import { EMPTY, answerWords, draftOf, encode } from './answer.js';

const single = { id: 'q1', kind: 'single-select', message: 'Color?', options: [{ id: 'blue', label: 'Blue' }, { id: 'red', label: 'Red' }], allowFreeformInput: true } as unknown as ChatInputQuestion;
const multi = { id: 'q2', kind: 'multi-select', message: 'Which?', options: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }] } as unknown as ChatInputQuestion;
const text = { id: 'q3', kind: 'text', message: 'Name?' } as unknown as ChatInputQuestion;
const yes = { id: 'q4', kind: 'boolean', message: 'Sure?' } as unknown as ChatInputQuestion;

describe('encode', () => {
  it('sends a choice, and text typed beside it as freeformValues', () => {
    expect(encode(single, { ...EMPTY, picked: ['blue'] })).toEqual({ state: 'submitted', value: { kind: 'selected', value: 'blue' } });
    expect(encode(multi, { picked: ['a', 'b'], text: 'c', other: true })).toEqual({ state: 'submitted', value: { kind: 'selected-many', value: ['a', 'b'], freeformValues: ['c'] } });
  });

  it('sends typed text alone as a text answer', () => {
    expect(encode(single, { picked: [], text: ' teal ', other: true })).toEqual({ state: 'submitted', value: { kind: 'text', value: 'teal' } });
  });

  it('ignores the box while "Other" is not picked', () => {
    expect(encode(single, { picked: [], text: 'teal', other: false })).toBeUndefined();
  });

  it('answers text and yes/no questions', () => {
    expect(encode(text, { ...EMPTY, text: 'Ann' })).toEqual({ state: 'submitted', value: { kind: 'text', value: 'Ann' } });
    expect(encode(yes, { ...EMPTY, picked: ['no'] })).toEqual({ state: 'submitted', value: { kind: 'boolean', value: false } });
    expect(encode(text, EMPTY)).toBeUndefined();
  });
});

describe('draftOf and answerWords', () => {
  it('reads an answer back into a draft and into words', () => {
    const answer = encode(multi, { picked: ['a'], text: 'c', other: true });
    expect(draftOf(answer)).toEqual({ picked: ['a'], text: 'c', other: true });
    expect(answerWords(multi, answer)).toBe('A, c');
    expect(answerWords(single, undefined)).toBe('Skipped');
  });
});
