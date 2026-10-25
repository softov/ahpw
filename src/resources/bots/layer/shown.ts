import type { ScenaLayout, TabPanelNode } from '@softov/scena/types';
import type { SessionSummary } from '@microsoft/agent-host-protocol';
import { refKey } from '../../../bridges/hosts.js';
import { botMarkOf } from '../chat/mark.js';

/** The active tab of each group in a tab-panel tree. */
function activeTabs(node: TabPanelNode): string[] {
  if (node.kind === 'split') return [...activeTabs(node.first), ...activeTabs(node.second)];
  const active = node.activeKey ?? node.tabs[0];
  return active === undefined ? [] : [active];
}

/** The mounts on screen: each visible surface's active one, and in a tab-panel, every group's. */
export function shownMountKeys(layout: ScenaLayout): string[] {
  return Object.values(layout.surfaces).flatMap((surface) => {
    if (surface === undefined || surface.visible === false) return [];
    if (surface.layout === 'tab-panel' && surface.tabPanel !== undefined) return activeTabs(surface.tabPanel.tree);
    return surface.activeContainerKey === undefined ? [] : [surface.activeContainerKey];
  });
}

/**
 * The bots whose chat is on screen, by `refKey(host, bot)`: a shown session
 * tab, keyed `session:<host>:<resource>`, whose summary carries a bot's mark.
 */
export function botsInShownChats(shown: readonly string[], hosts: readonly string[], sessions: readonly (readonly SessionSummary[] | undefined)[]): Set<string> {
  const bots = new Set<string>();
  hosts.forEach((host, at) => {
    const prefix = `session:${host}:`;
    for (const key of shown) {
      if (!key.startsWith(prefix)) continue;
      const resource = key.slice(prefix.length);
      const mark = botMarkOf(sessions[at]?.find((one) => one.resource === resource)?._meta);
      if (mark !== undefined) bots.add(refKey(host, mark.bot));
    }
  });
  return bots;
}
