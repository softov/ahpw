import type { AgentCustomization, ChildCustomization, Customization } from '@microsoft/agent-host-protocol';
import { enabledOf } from '../agents/words.js';

/** A custom agent a message can name: what the Agent picker lists. */
export interface CustomAgent {
  uri: string;
  name: string;
  description?: string;
}

/**
 * The enabled custom agents of a customization tree, in its order. A child is
 * on when its container and the child itself are on; a second child with the
 * same `uri` is dropped.
 */
export function customAgents(tree: readonly Customization[] | undefined): CustomAgent[] {
  const found: CustomAgent[] = [];
  const seen = new Set<string>();
  for (const container of tree ?? []) {
    if (!enabledOf(container)) continue;
    for (const child of (container as { children?: ChildCustomization[] }).children ?? []) {
      if (String(child.type) !== 'agent' || !enabledOf(child) || seen.has(child.uri)) continue;
      seen.add(child.uri);
      const agent = child as AgentCustomization;
      found.push({ uri: agent.uri, name: agent.name, ...(agent.description === undefined ? {} : { description: agent.description }) });
    }
  }
  return found;
}
