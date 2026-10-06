import { useMemo, type ReactElement } from 'react';
import { useScena, useStore } from '@softov/scena/react';
import { Alert, Badge, Spinner, Tree, type TreeNode } from '@softov/scena/ui';
import { automationReducer, type AutomationEntry, type AutomationState } from '@microsoft/agent-host-protocol';
import { AUTOMATIONS } from '../connection/data.js';
import { useChannel } from '../connection/channel.js';
import { ACTIVE_AUTOMATION } from './state.js';
import { titleOf } from './words.js';

/** The sidebar: the daemon's automations, by title. */
export default function AutomationExplorer(): ReactElement {
  const scena = useScena();
  const { state, error } = useChannel<AutomationState>(AUTOMATIONS, automationReducer);
  const active = useStore<string>(ACTIVE_AUTOMATION);
  const nodes = useMemo<TreeNode<AutomationEntry>[]>(
    () => [...(state?.entries ?? [])]
      .sort((a, b) => titleOf(a).localeCompare(titleOf(b)))
      .map((entry) => ({
        key: entry.resource,
        label: titleOf(entry),
        trailing: entry.definition.enabled ? undefined : <Badge tone="default" text="Off" />,
        data: entry,
      })),
    [state],
  );
  if (error !== null) return <Alert tone="danger" title="No automations" message={error} />;
  if (state === undefined) return <Spinner label="Reading the automations" />;
  if (nodes.length === 0) return <Alert tone="info" message="No automations yet." />;
  return (
    <Tree<AutomationEntry>
      nodes={nodes}
      title="Automations"
      selectedKey={active ?? null}
      onSelect={(node) => {
        if (node.data !== undefined) void scena.commands.execute('ahp.openAutomation', { resource: node.data.resource });
      }}
    />
  );
}
