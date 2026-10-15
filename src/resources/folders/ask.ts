import type { BindingPath, ReactiveStore } from '@softov/scena/types';

/** The name the dialog asks for, as `NameRequest`, or null. */
export const NAME_REQUEST = '$/folders/name' as BindingPath;

export interface NameRequest {
  id: number;
  title: string;
  /** What the box holds, such as "Name" or "Path". */
  label: string;
  /** What the box starts with. */
  value: string;
  /** The button that does it, named for the verb. */
  confirmLabel: string;
}

export interface NameOptions {
  title: string;
  label?: string;
  value?: string;
  confirmLabel: string;
  /** What is wrong with a value, or null when it can be used. */
  check?: (value: string) => string | null;
}

let store: ReactiveStore | undefined;
let sequence = 0;
let pending: { resolve: (answer: string | null) => void; check: (value: string) => string | null } | null = null;

export function initAsk(reactive: ReactiveStore): void {
  store = reactive;
}

/** Forget the store, answering an open question with nothing. */
export function resetAsk(): void {
  settleName(null);
  store = undefined;
}

/** Ask for a name, and answer it trimmed, or null when the dialog is closed. */
export function askName(options: NameOptions): Promise<string | null> {
  if (store === undefined) return Promise.resolve(null);
  // One question at a time: a new one answers the open one with nothing.
  settleName(null);
  sequence += 1;
  store.set(NAME_REQUEST, {
    id: sequence,
    title: options.title,
    label: options.label ?? 'Name',
    value: options.value ?? '',
    confirmLabel: options.confirmLabel,
  } satisfies NameRequest);
  return new Promise<string | null>((resolve) => {
    pending = { resolve, check: options.check ?? (() => null) };
  });
}

/** What is wrong with a value for the open question, or null. */
export const nameCheck = (value: string): string | null => pending?.check(value) ?? null;

/** Answer the open question. A second answer does nothing. */
export function settleName(answer: string | null): void {
  const open = pending;
  pending = null;
  store?.set(NAME_REQUEST, null);
  open?.resolve(answer === null ? null : answer.trim());
}
