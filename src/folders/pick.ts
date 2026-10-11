import type { BindingPath, ReactiveStore } from '@softov/scena/types';

/** The open folder question, as `FolderRequest`, or null. */
export const FOLDER_REQUEST = '$/folders/pick' as BindingPath;

export interface FolderRequest {
  id: number;
  title: string;
  /** The path the box starts at, ending in a slash so its folders are listed. */
  start: string;
  /** The home folder `~` stands for, with no slash at its end, or null. */
  home: string | null;
}

let store: ReactiveStore | undefined;
let sequence = 0;
let pending: ((answer: string | null) => void) | null = null;

export function initPick(reactive: ReactiveStore): void {
  store = reactive;
}

/** Forget the store, answering an open question with nothing. */
export function resetPick(): void {
  settleFolder(null);
  store = undefined;
}

/** Ask for a folder on the host by walking to it; answers the path as typed, or null when the picker is closed. */
export function askFolder(options: { title: string; start: string; home: string | null }): Promise<string | null> {
  if (store === undefined) return Promise.resolve(null);
  settleFolder(null);
  sequence += 1;
  store.set(FOLDER_REQUEST, { id: sequence, ...options } satisfies FolderRequest);
  return new Promise<string | null>((resolve) => {
    pending = resolve;
  });
}

/** Answer the open question. A second answer does nothing. */
export function settleFolder(answer: string | null): void {
  const open = pending;
  pending = null;
  store?.set(FOLDER_REQUEST, null);
  open?.(answer);
}
