import type { BindingPath, ReactiveStore } from '@softov/scena/types';

/** A choice about the chat: its value in the store, kept in localStorage, one per browser. */
export interface ChatChoice {
  path: BindingPath;
  /** The values it takes, in the order the form offers them. */
  values: readonly string[];
  /** The value with nothing kept. */
  usual: string;
  /** The value now: the store's, then the kept one, then `usual`. */
  read: (store: ReactiveStore) => string;
  /** Sets and keeps a value; one it does not take sets `usual`. */
  set: (store: ReactiveStore, value: string) => void;
}

export function chatChoice(path: BindingPath, storageKey: string, values: readonly string[], usual: string): ChatChoice {
  const taken = (value: unknown): value is string => typeof value === 'string' && values.includes(value);
  const kept = (): string | null => {
    try {
      return localStorage.getItem(storageKey);
    } catch {
      return null;
    }
  };
  return {
    path,
    values,
    usual,
    read: (store) => {
      const now = store.get<string>(path) ?? kept();
      return taken(now) ? now : usual;
    },
    set: (store, value) => {
      const next = taken(value) ? value : usual;
      try {
        localStorage.setItem(storageKey, next);
      } catch {
        // The store still has it for this visit.
      }
      store.set(path, next);
    },
  };
}

/** Whether a tool call starts open, as `ui.toolsExpanded` sets it. A thinking row always starts closed. */
export const TOOLS_EXPANDED = chatChoice('$/sessions/toolsExpanded' as BindingPath, 'ahpw.toolsExpanded', ['expanded', 'collapsed'], 'collapsed');

/** Whether the agent's text is drawn as Markdown or as plain text, as `ui.sessionMarkdown` sets it. */
export const SESSION_MARKDOWN = chatChoice('$/sessions/markdown' as BindingPath, 'ahpw.sessionMarkdown', ['enabled', 'disabled'], 'enabled');
