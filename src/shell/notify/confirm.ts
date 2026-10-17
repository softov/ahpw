import { translate } from '@softov/scena';
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
/** The open question's answer: yes, no, or null when it was closed without one. */
let pending: ((answer: boolean | null) => void) | null = null;

export function initConfirm(reactive: ReactiveStore, style: ConfirmStyle): void {
  store = reactive;
  if (reactive.get(CONFIRM_STYLE) === undefined) reactive.set(CONFIRM_STYLE, style);
}

/** Forget the store, closing an open question unanswered. */
export function resetConfirm(): void {
  settle(null);
  store = undefined;
}

export function confirmStyle(): ConfirmStyle {
  return store?.get<ConfirmStyle>(CONFIRM_STYLE) ?? DEFAULT_CONFIRM_STYLE;
}

export function setConfirmStyle(style: ConfirmStyle): void {
  store?.set(CONFIRM_STYLE, style);
}

/** Ask, and answer true only on yes. Before the shell is up, the browser asks. */
export async function confirm(options: ConfirmOptions): Promise<boolean> {
  return (await choose(options)) === true;
}

/**
 * Ask, and tell the two buttons apart from closing the question: true for the
 * confirm button, false for the cancel one, null for Escape or a click
 * outside. The browser's own dialog has no third answer, so its cancel is false.
 */
export function choose(options: ConfirmOptions): Promise<boolean | null> {
  if (store === undefined || confirmStyle() === 'native') {
    return Promise.resolve(window.confirm(options.body === undefined ? options.title : `${options.title}\n\n${options.body}`));
  }
  // One question at a time: a new one closes the open one unanswered.
  settle(null);
  sequence += 1;
  store.set(CONFIRM_REQUEST, {
    id: sequence,
    title: options.title,
    ...(options.body === undefined ? {} : { body: options.body }),
    confirmLabel: options.confirmLabel ?? translate('shell/notify/confirm'),
    cancelLabel: options.cancelLabel ?? translate('shell/notify/cancel'),
    tone: options.tone ?? 'default',
  } satisfies ConfirmRequest);
  return new Promise<boolean | null>((resolve) => {
    pending = resolve;
  });
}

/** Answer the open question; null closes it unanswered. A second answer does nothing. */
export function settle(answer: boolean | null): void {
  const resolve = pending;
  pending = null;
  store?.set(CONFIRM_REQUEST, null);
  resolve?.(answer);
}
