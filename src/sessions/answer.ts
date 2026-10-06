import type { ChatInputAnswer, ChatInputQuestion } from '@microsoft/agent-host-protocol';

/** What a person has filled in for one question so far. */
export interface Draft {
  /** Options picked; for a yes/no question, `yes` or `no`. */
  picked: string[];
  /** Typed text: the answer to a text or number question, or the "Other" box. */
  text: string;
  /** True when the "Other" box is part of the answer. */
  other: boolean;
}

export const EMPTY: Draft = { picked: [], text: '', other: false };

/** The options a question offers; a yes/no question offers two. */
export function optionsOf(question: ChatInputQuestion): { id: string; label: string; description?: string; recommended?: boolean }[] {
  const kind = String(question.kind);
  if (kind === 'boolean') return [{ id: 'yes', label: 'Yes' }, { id: 'no', label: 'No' }];
  return 'options' in question ? question.options : [];
}

/** True when the question takes a choice rather than typed text. */
export function isChoice(question: ChatInputQuestion): boolean {
  const kind = String(question.kind);
  return kind === 'single-select' || kind === 'multi-select' || kind === 'boolean';
}

export function allowsOther(question: ChatInputQuestion): boolean {
  return 'allowFreeformInput' in question && question.allowFreeformInput === true;
}

/**
 * A draft as the protocol carries it, the way VS Code sends one: typed text
 * alone is a text answer, and text beside a choice rides in `freeformValues`.
 * Undefined while nothing is filled in.
 */
export function encode(question: ChatInputQuestion, draft: Draft): ChatInputAnswer | undefined {
  const kind = String(question.kind);
  const typed = draft.other ? draft.text.trim() : '';
  const submitted = (value: unknown): ChatInputAnswer => ({ state: 'submitted', value } as unknown as ChatInputAnswer);
  if (kind === 'text') return draft.text.trim() === '' ? undefined : submitted({ kind: 'text', value: draft.text });
  if (kind === 'number' || kind === 'integer') {
    const number = Number(draft.text);
    return draft.text.trim() === '' || Number.isNaN(number) ? undefined : submitted({ kind: 'number', value: number });
  }
  if (kind === 'boolean') return draft.picked[0] === undefined ? undefined : submitted({ kind: 'boolean', value: draft.picked[0] === 'yes' });
  if (kind === 'multi-select') {
    if (draft.picked.length === 0 && typed === '') return undefined;
    return submitted({ kind: 'selected-many', value: draft.picked, ...(typed === '' ? {} : { freeformValues: [typed] }) });
  }
  const chosen = draft.picked[0];
  if (chosen === undefined) return typed === '' ? undefined : submitted({ kind: 'text', value: typed });
  return submitted({ kind: 'selected', value: chosen, ...(typed === '' ? {} : { freeformValues: [typed] }) });
}

/** A draft from an answer the host already holds, so a form reopens filled in. */
export function draftOf(answer: ChatInputAnswer | undefined): Draft {
  const value = (answer as { value?: { kind?: string; value?: unknown; freeformValues?: string[] } } | undefined)?.value;
  if (value === undefined) return EMPTY;
  const free = value.freeformValues?.[0];
  const withFree = (draft: Draft): Draft => (free === undefined ? draft : { ...draft, text: free, other: true });
  switch (value.kind) {
    case 'text': return { picked: [], text: String(value.value ?? ''), other: true };
    case 'number': return { ...EMPTY, text: String(value.value ?? '') };
    case 'boolean': return { ...EMPTY, picked: [value.value === true ? 'yes' : 'no'] };
    case 'selected': return withFree({ ...EMPTY, picked: [String(value.value)] });
    case 'selected-many': return withFree({ ...EMPTY, picked: Array.isArray(value.value) ? value.value.map(String) : [] });
    default: return EMPTY;
  }
}

/** An answer in words: the labels picked and anything typed. */
export function answerWords(question: ChatInputQuestion, answer: ChatInputAnswer | undefined): string {
  const value = (answer as { value?: { kind?: string; value?: unknown; freeformValues?: string[] } } | undefined)?.value;
  if (value === undefined) return 'Skipped';
  const label = (id: string): string => optionsOf(question).find((one) => one.id === id)?.label ?? id;
  const free = value.freeformValues ?? [];
  switch (value.kind) {
    case 'boolean': return value.value === true ? 'Yes' : 'No';
    case 'selected': return [label(String(value.value)), ...free].join(', ');
    case 'selected-many': return [...(Array.isArray(value.value) ? value.value.map((one) => label(String(one))) : []), ...free].join(', ');
    default: return String(value.value ?? '');
  }
}
