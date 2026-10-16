import type { SessionSummary } from '@microsoft/agent-host-protocol';
import { folderLabel } from '../../bridges/words.js';
import { bare } from './roots.js';

/** A folder the host has seen used, and by how many of its sessions. */
export interface UsedFolder {
  path: string;
  sessions: number;
}

/**
 * The folders worth offering for a new session: those the host's sessions
 * work in, most sessions first, then by the newest session; then the
 * folders added to the workspace that no session uses yet. The host's own
 * folder is left out, as it has a line of its own.
 */
export function usedFolders(sessions: readonly SessionSummary[], added: readonly string[], defaultDirectory: string | null | undefined, max = 8): UsedFolder[] {
  const own = defaultDirectory === null || defaultDirectory === undefined ? null : bare(defaultDirectory);
  const counts = new Map<string, number>();
  for (const session of sessions) {
    const uri = session.workingDirectories?.[0];
    if (uri === undefined || uri === '') continue;
    const key = bare(uri);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  // A stable sort keeps the newest-session order among equal counts.
  const used = [...counts].sort((a, b) => b[1] - a[1]);
  for (const uri of added) if (!counts.has(bare(uri))) used.push([bare(uri), 0]);
  return used
    .filter(([uri]) => uri !== own)
    .slice(0, max)
    .map(([uri, count]) => ({ path: folderLabel(uri), sessions: count }));
}
