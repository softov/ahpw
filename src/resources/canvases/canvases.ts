import { useEffect, useRef } from 'react';
import { canvasReducer, type CanvasReference, type CanvasState } from '@microsoft/agent-host-protocol';
import { useScena } from '@softov/scena/react';
import { useChannels } from '../../bridges/channel.js';
import { CANVAS_AUTO_OPEN } from './settings.js';

/** A canvas tab's key: one tab per canvas of a host. */
export const canvasKey = (host: string, resource: string): string => `canvas:${host}:${resource}`;

/** A canvas of a chat: its channel and, once read, its state. */
export interface ChatCanvas {
  resource: string;
  state: CanvasState | undefined;
}

/** The canvases a chat lists, each followed while the calling component is on screen. */
export function useChatCanvases(host: string, refs: readonly CanvasReference[] | undefined): ChatCanvas[] {
  const resources = (refs ?? []).map((one) => one.resource);
  const states = useChannels<CanvasState>(host, resources, canvasReducer);
  return resources.map((resource, at) => ({ resource, state: states[at] }));
}

/** What a canvas is called: its title, its canvas id, or null when it has neither. */
export function canvasName(state: CanvasState | undefined): string | null {
  if (state?.title !== undefined && state.title !== '') return state.title;
  if (state !== undefined && state.canvasId !== '') return state.canvasId;
  return null;
}

/** The canvases in `now` that `before` did not hold, in their order. */
export function joined(before: ReadonlySet<string>, now: readonly string[]): string[] {
  return now.filter((resource) => !before.has(resource));
}

/**
 * Opens each canvas that joins the chat `chat` while the calling component is
 * on screen, when `ui.canvasAutoOpen` is on. The canvases the chat held when
 * it was first read, or when the chat changes, open only on a click.
 * `refs` is undefined until the chat is read.
 */
export function useCanvasAutoOpen(chat: string | undefined, refs: readonly CanvasReference[] | undefined, open: (resource: string) => void): void {
  const scena = useScena();
  const seen = useRef<{ chat: string | undefined; resources: Set<string> } | null>(null);
  const key = refs === undefined ? null : refs.map((one) => one.resource).join('\n');
  useEffect(() => {
    if (key === null) return;
    const now = key === '' ? [] : key.split('\n');
    const last = seen.current;
    seen.current = { chat, resources: new Set(now) };
    if (last === null || last.chat !== chat || CANVAS_AUTO_OPEN.read(scena.store) !== 'enabled') return;
    for (const resource of joined(last.resources, now)) open(resource);
  // `open` is a new function each render; the list's key decides when to look.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scena, chat, key]);
}
