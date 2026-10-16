import { useEffect } from 'react';
import { useStore } from '@softov/scena/react';
import { channelErrorPath, channelPath, hostBridge, type Reducer } from './data.js';
import { useEach } from './hosts.js';

/** A channel's state on the host `host`, followed while the calling component is on screen. */
export function useChannel<S>(host: string, uri: string | undefined, reducer: Reducer): { state: S | undefined; error: string | null } {
  useEffect(() => (uri === undefined ? undefined : hostBridge(host).follow(uri, reducer)), [host, uri, reducer]);
  const state = useStore<S>(channelPath(host, uri ?? ''));
  const error = useStore<string | null>(channelErrorPath(host, uri ?? ''));
  return { state: uri === undefined ? undefined : state, error: error ?? null };
}

/** The channel `uri` on each of `hosts`, followed while the calling component is on screen; one state and one error per host. */
export function useChannelOnEach<S>(hosts: readonly string[], uri: string, reducer: Reducer): { states: (S | undefined)[]; errors: (string | null)[] } {
  const key = hosts.join('\n');
  useEffect(() => {
    const stops = key === '' ? [] : key.split('\n').map((host) => hostBridge(host).follow(uri, reducer));
    return () => {
      for (const stop of stops) stop();
    };
  }, [key, uri, reducer]);
  const states = useEach<S>(hosts.map((host) => channelPath(host, uri)));
  const errors = useEach<string | null>(hosts.map((host) => channelErrorPath(host, uri)));
  return { states, errors: errors.map((one) => one ?? null) };
}
