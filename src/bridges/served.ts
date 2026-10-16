/**
 * Which hosts serve a plugin channel, from their offers: a list follows a
 * plugin's channel only on those, and its activity bar entry shows while one does.
 */

import { useMemo } from 'react';
import type { BindingPath, Disposable, Scena } from '@softov/scena/types';
import { ahpPaths } from './data.js';
import { onEachHost, useEach } from './hosts.js';
import type { Offers } from './offers.js';

const serves = (offers: Offers | undefined, scheme: string): boolean => offers?.channels.includes(scheme) ?? false;

/** Those of `hosts` whose plugins serve the channel `scheme`, such as `x-ahpd-computers`. */
export function useServingHosts(hosts: readonly string[], scheme: string): string[] {
  const offers = useEach<Offers>(hosts.map((host) => ahpPaths(host).offers));
  return useMemo(() => hosts.filter((_, at) => serves(offers[at], scheme)), [hosts, offers, scheme]);
}

/** Keeps `path` true while any host this page connects to serves the channel `scheme`, and false otherwise. */
export function trackServed(scena: Scena, scheme: string, path: BindingPath): Disposable {
  const serving = new Set<string>();
  const publish = (): void => {
    const now = serving.size > 0;
    if (scena.store.get<boolean>(path) !== now) scena.store.set(path, now);
  };
  const watching = onEachHost(scena, (host) => {
    const check = (): void => {
      if (serves(scena.store.get<Offers>(ahpPaths(host).offers), scheme)) serving.add(host);
      else serving.delete(host);
      publish();
    };
    check();
    const stop = scena.store.subscribe(ahpPaths(host).offers, check);
    return {
      dispose: () => {
        stop.dispose();
        serving.delete(host);
        publish();
      },
    };
  });
  publish();
  return watching;
}
