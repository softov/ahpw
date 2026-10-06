import { useEffect } from 'react';
import { useStore } from '@softov/scena/react';
import { channelErrorPath, channelPath, follow, type Reducer } from './data.js';

/** A channel's state, followed while the calling component is on screen. */
export function useChannel<S>(uri: string | undefined, reducer: Reducer): { state: S | undefined; error: string | null } {
  useEffect(() => (uri === undefined ? undefined : follow(uri, reducer)), [uri, reducer]);
  const state = useStore<S>(channelPath(uri ?? ''));
  const error = useStore<string | null>(channelErrorPath(uri ?? ''));
  return { state: uri === undefined ? undefined : state, error: error ?? null };
}
