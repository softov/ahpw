import { translate } from '@softov/scena';
import type { JsonSchemaObject, SchemaFormGroup, SchemaFormSection } from '@softov/scena/ui';

/** A section as this file names it: its id, which is also its title's key, and its keys. */
type Named = [id: string, keys: readonly string[]];

/** What the host and the daemon declare themselves, by section. */
const HOST: readonly Named[] = [
  ['general', ['paths', 'defaultShell', 'updateCheck']],
  ['changeWords', ['changeWords']],
  ['trust', ['workspaceTrust']],
  ['limits', ['clientQueueBytes', 'replayBytes', 'wire']],
];

const DAEMON: readonly Named[] = [
  ['listener', ['port', 'host', 'http', 'routes']],
  ['sessions', ['closedChats', 'archiveDirtyWorktree', 'pullRequestLookup']],
  ['tools', ['advancedTools', 'sessionTools', 'sessionToolsProviders']],
  ['mcp', ['mcpServers']],
];

/** The keys a VS Code window pushes, as ahpd declares them in `vscoderootconfig.ts`, by subject. */
const VSCODE: readonly Named[] = [
  ['network', ['http.proxy', 'http.proxyKerberosServicePrincipal', 'http.noProxy', 'systemProxyEnabled']],
  ['telemetry', ['telemetryLevel', 'editTelemetryEnabled', 'disableRepoInfoTelemetry']],
  ['approval', ['terminalAutoApproveEnabled', 'globalAutoApproveEnabled', 'autoApprovePolicyRestricted', 'autoReplyEnabled', 'editAutoApprovePatterns', 'terminalAutoApproveRules']],
  ['agents', ['codexAgentEnabled', 'agentOrchestrationLimits', 'copilotMultiRootEnabled', 'claudeMultiRootEnabled', 'codexMultiRootEnabled', 'migrateLegacyCopilotCliEnabled', 'overlapProviderPreparation']],
  ['vscodeMcp', ['githubMcpServerEnabled', 'mcpToolRoutingEnabled', 'mcpConnectorsEnabled']],
  ['vscodeSessions', ['sessionSyncEnabled', 'sessionCatalogEnabled', 'showExternalSessions', 'workspaceSnapshotEnabled', 'autoArchiveMergedSessionsAfterDays', 'autoDeleteArchivedMergedSessionsAfterDays']],
  ['pullRequests', ['autoAttachPullRequests', 'agentMerge.enabled', 'agentMerge.addressReviews', 'agentMerge.fixCI', 'agentMerge.resolveConflicts', 'agentMerge.mergePullRequest', 'agentMerge.mergeMethod', 'agentMerge.replyAttribution']],
  ['features', ['markdownPlanRichLinksEnabled', 'artifactTools', 'canvasesEnabled', 'automationsEnabled', 'automationRunTimeoutMinutes']],
];

/** A plugin's key: one per plugin, `plugins.<name>`. */
const PLUGIN = 'plugins.';

const section = ([id, keys]: Named): SchemaFormSection => ({ id, title: translate(`host/settings/sections/${id}`), keys: [...keys] });

/**
 * The sections the settings' sections view draws, for the schema the host
 * sent. A plugin gets a section of its own, titled by its name, because
 * plugins come and go; a key named here that the schema lacks is dropped by
 * the view, and a key the schema has that nothing here names goes to its Other.
 */
export function settingsGroups(schema: JsonSchemaObject): SchemaFormGroup[] {
  const plugins = Object.keys(schema.properties ?? {})
    .filter((key) => key.startsWith(PLUGIN))
    .map((key): SchemaFormSection => ({ id: key, title: key.slice(PLUGIN.length), keys: [key] }));
  return [
    { id: 'host', title: translate('host/settings/groups/host'), sections: HOST.map(section) },
    { id: 'daemon', title: translate('host/settings/groups/daemon'), sections: DAEMON.map(section) },
    { id: 'plugins', title: translate('host/settings/groups/plugins'), sections: plugins },
    { id: 'vscode', title: translate('host/settings/groups/vscode'), sections: VSCODE.map(section) },
  ];
}
