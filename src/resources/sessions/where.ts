import type { SessionSummary } from '@microsoft/agent-host-protocol';
import type { ReactiveStore } from '@softov/scena/types';
import { ahpPaths } from '../../bridges/data.js';
import { folderLabel } from '../../bridges/words.js';
import { addedPath } from '../folders/added.js';
import { usedFolders } from '../folders/used.js';

/** A folder the new session can start in, on its host. */
export interface Where {
  host: string;
  path: string;
  /** How many of the host's sessions work in it; 0 for the host's own folder or an added one. */
  sessions: number;
}

/** A folder's last segment, which names it in the pill. */
export const folderName = (path: string): string => path.replace(/[\\/]+$/, '').split(/[\\/]/).pop() || path;

/** What the pill reads: the folder, and with every host the host after it, as VS Code writes `ahpd [dev1]`. */
export function whereLabel(path: string, host: string | null): string {
  const name = path.trim() === '' ? '' : folderName(path);
  return host === null ? name : `${name} [${host}]`;
}

/** The folders each host offers: its own first, then those its sessions and the workspace use. */
export function wheresOf(store: ReactiveStore, hosts: readonly string[]): Where[] {
  return hosts.flatMap((host) => {
    const home = store.get<string | null>(ahpPaths(host).defaultDirectory) ?? null;
    const used = usedFolders(store.get<SessionSummary[]>(ahpPaths(host).sessions) ?? [], store.get<string[]>(addedPath(host)) ?? [], home);
    const own: Where[] = home === null ? [] : [{ host, path: folderLabel(home).replace(/\/+$/, ''), sessions: 0 }];
    return [...own, ...used.map((one): Where => ({ host, path: one.path, sessions: one.sessions }))];
  });
}
