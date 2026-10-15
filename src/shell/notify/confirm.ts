import type { BindingPath, ReactiveStore } from '@softov/scena/types';

/** The question the dialog shows, or null. */
export const CONFIRM_REQUEST = '$/notify/confirm' as BindingPath;

/** How a question is asked: `native` or `modal`. Read on each question. */
export const CONFIRM_STYLE = '$/notify/confirmStyle' as BindingPath;

/** `native` is the browser's `window.confirm`; `modal` is the page's own dialog. */
export type ConfirmStyle = 'native' | 'modal';

export const DEFAULT_CONFIRM_STYLE: ConfirmStyle = 'modal';

export interface ConfirmRequest {
  id: number;
  title: string;
  body?: string;
  /** The button that does it, named for the verb. */
  confirmLabel: string;
  cancelLabel: string;
  tone: 'danger' | 'default';
}

export interface ConfirmOptions {
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'default';
}

let store: ReactiveStore | undefined;
let sequence = 0;
let pending: ((answer: boolean) => void) | null = null;

export function initConfirm(reactive: ReactiveStore, style: ConfirmStyle): void {
  store = reactive;
  if (reactive.get(CONFIRM_STYLE) === undefined) reactive.set(CONFIRM_STYLE, style);
}

/** Forget the store, answering an open question with no. */
export function resetConfirm(): void {
  settle(false);
  store = undefined;
}

export function confirmStyle(): ConfirmStyle {
  return store?.get<ConfirmStyle>(CONFIRM_STYLE) ?? DEFAULT_CONFIRM_STYLE;
}

export function setConfirmStyle(style: ConfirmStyle): void {
  store?.set(CONFIRM_STYLE, style);
}

/** Ask, and answer true only on yes. Before the shell is up, the browser asks. */
export function confirm(options: ConfirmOptions): Promise<boolean> {
  if (store === undefined || confirmStyle() === 'native') {
    return Promise.resolve(window.confirm(options.body === undefined ? options.title : `${options.title}\n\n${options.body}`));
  }
  // One question at a time: a new one answers the open one with no.
  settle(false);
  sequence += 1;
  store.set(CONFIRM_REQUEST, {
    id: sequence,
    title: options.title,
    ...(options.body === undefined ? {} : { body: options.body }),
    confirmLabel: options.confirmLabel ?? 'Confirm',
    cancelLabel: options.cancelLabel ?? 'Cancel',
    tone: options.tone ?? 'default',
  } satisfies ConfirmRequest);
  return new Promise<boolean>((resolve) => {
    pending = resolve;
  });
}

/** Answer the open question. A second answer does nothing. */
export function settle(answer: boolean): void {
  const resolve = pending;
  pending = null;
  store?.set(CONFIRM_REQUEST, null);
  resolve?.(answer);
}
