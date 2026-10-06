import type { AgentInfo, Customization, SessionModelInfo } from '@microsoft/agent-host-protocol';
import { tokens } from '../sessions/turn.js';

/** How many models an agent offers, in words. */
export function modelsLine(agent: AgentInfo): string {
  const count = agent.models.length;
  return count === 0 ? 'No models listed' : count === 1 ? '1 model' : `${count} models`;
}

/** What an agent can do beyond one chat in one folder, in words. */
export function capabilitiesOf(agent: AgentInfo): string[] {
  const out: string[] = [];
  const chats = agent.capabilities?.multipleChats;
  if (chats !== undefined) out.push(chats.fork === true ? 'Several chats per session, and forks' : 'Several chats per session');
  const folders = agent.capabilities?.multipleWorkingDirectories;
  if (folders !== undefined) out.push(folders.immutablePrimary === true ? 'Several folders, the first one fixed' : 'Several folders');
  return out;
}

/** A model's limits, as one short line: context, output, vision. */
export function limitsOf(model: SessionModelInfo): string {
  const bits: string[] = [];
  if (model.maxContextWindow !== undefined) bits.push(`${tokens(model.maxContextWindow)} context`);
  if (model.maxOutputTokens !== undefined) bits.push(`${tokens(model.maxOutputTokens)} out`);
  if (model.supportsVision === true) bits.push('images');
  return bits.join(' \u{00B7} ');
}

/** The kind of a customization, as a person names it. */
const KIND: Record<string, string> = { plugin: 'Plugin', directory: 'Folder', mcpServer: 'MCP server' };

/** One customization: its name, its kind and its state, in words. */
export function customizationOf(item: Customization): { name: string; kind: string; state: string } {
  const type = String(item.type);
  const bag = item as unknown as Record<string, unknown>;
  const status = (bag['state'] as { status?: string } | undefined)?.status;
  const enabled = bag['enabled'];
  const state = status !== undefined ? status : enabled === false ? 'off' : enabled === true ? 'on' : '';
  return { name: item.name, kind: KIND[type] ?? type, state };
}

/** What signing in to an agent involves: each resource it protects, and the scopes it asks for. */
export function signInOf(agent: AgentInfo): { name: string; scopes: string; required: boolean }[] {
  return (agent.protectedResources ?? []).map((one) => ({
    name: one.resource_name ?? one.resource,
    scopes: (one.scopes_supported ?? []).join(', '),
    required: one.required === true,
  }));
}
