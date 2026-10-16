import { useCallback, useMemo, useRef, useSyncExternalStore } from 'react';
import { combineDisposables, translate } from '@softov/scena';
import { useScena, useStore } from '@softov/scena/react';
import type { BindingPath, Disposable, ListSpec, ReactiveStore, Scena } from '@softov/scena/types';
import { embedder, embedMode, type EmbedHost } from '../shell/embed/index.js';
import { hostKey } from '../lib/storage-keys.js';
import { ahpPaths, windowHost, type Connection } from './data.js';
import { hostState } from './host-state.js';

/** Whether this window shows one host or every host, for a `when` clause: `mono` or `multi`. */
export const EMBED_MODE = '$/ahp/embedMode' as BindingPath;
/** In multi, every host the embedder knows, in its order, as `{ id, name }`. */
export const HOST_LIST = '$/ahp/hostList' as BindingPath;
/** In multi, the host ids the lists show; none means every host. */
export const HOST_FILTER = '$/ahp/hostFilter' as BindingPath;
/** In multi, the unread and working sessions of every host, summed for the activity bar. */
const EVERY_UNREAD = '$/ahp/every/sessionsUnread' as BindingPath;
const EVERY_WORKING = '$/ahp/every/sessionsWorking' as BindingPath;

/** Where the activity bar reads the unread and working counts: the one host's in mono, every host's sum in multi. */
export function sessionCountPaths(): { unread: BindingPath; working: BindingPath } {
  if (embedMode() === 'multi') return { unread: EVERY_UNREAD, working: EVERY_WORKING };
  const paths = ahpPaths(windowHost());
  return { unread: paths.sessionsUnread, working: paths.sessionsWorking };
}

/** A host as the lists name it. */
export interface HostName {
  id: string;
  name: string;
}

/** The host filter's menu: one command per host, and one for every host. */
export const HOST_SLOT = 'hosts:filter';

/** The header action each list declares; scena draws it in multi only. */
export const HOST_FILTER_ACTION = {
  command: 'hosts.filter',
  menu: HOST_SLOT,
  icon: '\u{1F5A5}\u{FE0E}',
  label: { t: 'hosts/filter' },
  when: `${EMBED_MODE} == "multi"`,
  active: `${HOST_FILTER} != null`,
};

/** Where the filter is kept, per window. */
const FILTER_KEY = hostKey('ahpd-web.host-filter');

function readFilter(): string[] | null {
  try {
    const held: unknown = JSON.parse(localStorage.getItem(FILTER_KEY) ?? 'null');
    return Array.isArray(held) && held.length > 0 && held.every((one) => typeof one === 'string') ? held : null;
  } catch {
    return null;
  }
}

function writeFilter(ids: string[] | null): void {
  try {
    if (ids === null) localStorage.removeItem(FILTER_KEY);
    else localStorage.setItem(FILTER_KEY, JSON.stringify(ids));
  } catch {
    // Not kept, which only means the next visit shows every host.
  }
}

/** The key of one item on one host, for a row or a map; a host id holds no NUL. */
export const refKey = (host: string, id: string): string => `${host}\u0000${id}`;

/** The host and the item of a `refKey`. */
export function refOf(key: string): { host: string; id: string } {
  const cut = key.indexOf('\u0000');
  return cut < 0 ? { host: windowHost(), id: key } : { host: key.slice(0, cut), id: key.slice(cut + 1) };
}

/** Every host this page connects to, from the store: the window's host in mono. */
export function everyHost(store: ReactiveStore): string[] {
  if (embedMode() !== 'multi') return [windowHost()];
  return (store.get<HostName[]>(HOST_LIST) ?? []).map((host) => host.id);
}

/** The name the lists give the host `id`, from the store; its id until the embedder has said. */
export function hostNameOf(store: ReactiveStore, id: string): string {
  return store.get<HostName[]>(HOST_LIST)?.find((host) => host.id === id)?.name ?? id;
}

/**
 * Calls `watch(host)` for every host this page connects to, and again for a
 * host the embedder adds; a removed host's watch is disposed with it.
 */
export function onEachHost(scena: Scena, watch: (host: string) => Disposable): Disposable {
  const held = new Map<string, Disposable>();
  const sync = (): void => {
    const now = new Set(everyHost(scena.store));
    for (const [host, watching] of held) {
      if (now.has(host)) continue;
      watching.dispose();
      held.delete(host);
    }
    for (const host of now) if (!held.has(host)) held.set(host, watch(host));
  };
  sync();
  const stop = scena.store.subscribe(HOST_LIST, sync);
  return {
    dispose: () => {
      stop.dispose();
      for (const watching of held.values()) watching.dispose();
      held.clear();
    },
  };
}

/** A host's name for a menu, with its state beside it while it is not connected. */
export function hostLabel(store: ReactiveStore, id: string): string {
  const state = hostState(store.get<Connection>(ahpPaths(id).connection), store.get<boolean>(ahpPaths(id).refused));
  const name = hostNameOf(store, id);
  return state === 'connected' ? name : translate('hosts/named', { host: name, state: translate(`hosts/state/${state}`) });
}

/** The hosts the lists show, from the store: the window's host in mono, else the picked hosts or every host. */
export function shownHosts(store: ReactiveStore): string[] {
  if (embedMode() !== 'multi') return [windowHost()];
  return pick(store.get<HostName[]>(HOST_LIST) ?? [], store.get<string[] | null>(HOST_FILTER) ?? null);
}

function pick(list: readonly HostName[], filter: readonly string[] | null): string[] {
  const ids = list.map((host) => host.id);
  const picked = filter === null ? [] : ids.filter((id) => filter.includes(id));
  return picked.length > 0 ? picked : ids;
}

/** `shownHosts`, kept current for a component. */
export function useShownHosts(): string[] {
  const list = useStore<HostName[]>(HOST_LIST);
  const filter = useStore<string[] | null>(HOST_FILTER);
  return useMemo(() => (embedMode() !== 'multi' ? [windowHost()] : pick(list ?? [], filter ?? null)), [list, filter]);
}

/** `everyHost`, kept current for a component. */
export function useEveryHost(): string[] {
  const list = useStore<HostName[]>(HOST_LIST);
  return useMemo(() => (embedMode() !== 'multi' ? [windowHost()] : (list ?? []).map((host) => host.id)), [list]);
}

/** The name the lists give a host; its id until the embedder has said. */
export function useHostNames(): (id: string) => string {
  const list = useStore<HostName[]>(HOST_LIST);
  return useCallback((id: string) => list?.find((host) => host.id === id)?.name ?? id, [list]);
}

/** The values at `paths`, kept current; the same array while none of them changes. */
export function useEach<T>(paths: readonly BindingPath[]): (T | undefined)[] {
  const scena = useScena();
  const key = paths.join('\n');
  const held = useRef<{ key: string; values: (T | undefined)[] } | null>(null);
  const subscribe = useCallback((changed: () => void) => {
    const watches = key === '' ? [] : key.split('\n').map((path) => scena.store.subscribe(path as BindingPath, changed));
    return () => {
      for (const watch of watches) watch.dispose();
    };
  }, [scena, key]);
  const snapshot = (): (T | undefined)[] => {
    const values = paths.map((path) => scena.store.get<T>(path));
    const last = held.current;
    if (last !== null && last.key === key && last.values.length === values.length && last.values.every((one, at) => one === values[at])) return last.values;
    held.current = { key, values };
    return values;
  };
  return useSyncExternalStore(subscribe, snapshot);
}

/** The host filter's menu as a palette list. */
function filterList(): ListSpec {
  return { title: translate('hosts/filter'), query: { slot: HOST_SLOT } };
}

/**
 * In multi: the host list from the embedder, the filter kept per window, the
 * filter's menu, and the embedder's request to show one host. Mono registers
 * nothing but the mode.
 */
/** Show only the hosts `ids` in the lists, or every host for null, and keep it for this window. */
export function setHostFilter(store: ReactiveStore, ids: string[] | null): void {
  store.set(HOST_FILTER, ids);
  writeFilter(ids);
}

export function registerHosts(scena: Scena): Disposable {
  scena.store.set(EMBED_MODE, embedMode());
  if (embedder === undefined || embedMode() !== 'multi') return { dispose: () => undefined };
  const set = (ids: string[] | null): void => setHostFilter(scena.store, ids);
  scena.store.set(HOST_FILTER, readFilter());
  let perHost: Disposable = { dispose: () => undefined };
  const listed = (hosts: EmbedHost[]): void => {
    scena.store.set(HOST_LIST, hosts.map((host): HostName => ({ id: host.id, name: host.name })));
    perHost.dispose();
    perHost = combineDisposables(
      ...hosts.map((host) => scena.commands.register({
        id: `hosts.show.${host.id}`,
        title: () => hostLabel(scena.store, host.id),
        slots: [HOST_SLOT],
        active: (ctx) => (ctx.store.get<string[] | null>(HOST_FILTER) ?? []).includes(host.id),
        // A pick adds the host to the filter or takes it out; the last one out shows every host.
        run: (ctx) => {
          const now = ctx.store.get<string[] | null>(HOST_FILTER) ?? [];
          const next = now.includes(host.id) ? now.filter((id) => id !== host.id) : [...now, host.id];
          set(next.length === 0 ? null : next);
        },
      })),
    );
  };
  void embedder.hosts().then(listed);
  const sum = (): void => {
    const hosts = everyHost(scena.store);
    const total = (pick: (paths: ReturnType<typeof ahpPaths>) => BindingPath): number => hosts.reduce((all, host) => all + (scena.store.get<number>(pick(ahpPaths(host))) ?? 0), 0);
    scena.store.set(EVERY_UNREAD, total((paths) => paths.sessionsUnread));
    scena.store.set(EVERY_WORKING, total((paths) => paths.sessionsWorking));
  };
  return combineDisposables(
    onEachHost(scena, (host) => {
      sum();
      return combineDisposables(scena.store.subscribe(ahpPaths(host).sessionsUnread, sum), scena.store.subscribe(ahpPaths(host).sessionsWorking, sum));
    }),
    { dispose: () => perHost.dispose() },
    { dispose: embedder.onHosts(listed) },
    { dispose: embedder.onFocusHost?.((id) => set([id])) ?? (() => undefined) },
    scena.commands.register({
      id: 'hosts.filter',
      title: () => translate('hosts/filter'),
      run: (ctx) => {
        if (ctx.host !== undefined) ctx.host.pushList(filterList());
      },
    }),
    scena.commands.register({
      id: 'hosts.every',
      title: () => translate('hosts/every'),
      slots: [HOST_SLOT],
      active: (ctx) => (ctx.store.get<string[] | null>(HOST_FILTER) ?? null) === null,
      run: () => set(null),
    }),
  );
}
