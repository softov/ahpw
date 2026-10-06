import { useEffect, useMemo, type ReactElement } from 'react';
import { useScena, useStore } from '@softov/scena/react';
import { Alert, Spinner, Tree, type TreeNode } from '@softov/scena/ui';
import { ACTIVE_COMMAND, MANIFEST, MANIFEST_ERROR } from '../manifest/data.js';
import { sectionsOf } from '../manifest/sections.js';
import type { ManifestCommand, ProgramManifest } from '../manifest/types.js';

/** A command's id after its group: `plugin.config.set` is listed as `config set`. */
function labelOf(command: ManifestCommand, group: string): string {
  const parts = command.id.split('.');
  const rest = parts[0] === group ? parts.slice(1) : parts;
  return (rest.length === 0 ? parts : rest).join(' ');
}

/** The sidebar: the commands of one group. */
export default function CommandExplorer({ group }: { group?: string }): ReactElement {
  const scena = useScena();
  const manifest = useStore<ProgramManifest>(MANIFEST);
  const error = useStore<string | null>(MANIFEST_ERROR);
  const active = useStore<string>(ACTIVE_COMMAND);
  const section = useMemo(
    () => (manifest === undefined ? undefined : sectionsOf(manifest).find((one) => one.name === group)),
    [manifest, group],
  );
  const nodes = useMemo<TreeNode<ManifestCommand>[]>(
    () => (section?.commands ?? []).map((command) => ({
      key: command.id,
      label: labelOf(command, section?.name ?? ''),
      trailing: command.http.method === 'GET' ? undefined : <span className="web-method">{command.http.method}</span>,
      data: command,
    })),
    [section],
  );

  // Nothing open yet: open the first command the manifest names.
  useEffect(() => {
    const first = manifest?.commands[0];
    if (active === undefined && first !== undefined) void scena.commands.execute('ahpd.open', { id: first.id });
  }, [manifest, active, scena]);

  if (error) return <Alert tone="danger" title="No manifest" message={error} />;
  if (manifest === undefined) return <Spinner label="Reading the manifest" />;
  if (section === undefined) return <Alert tone="warning" message={`This daemon has no ${group ?? ''} commands.`} />;
  return (
    <Tree<ManifestCommand>
      nodes={nodes}
      title={section.title}
      selectedKey={active ?? null}
      onSelect={(node) => {
        if (node.data !== undefined) void scena.commands.execute('ahpd.open', { id: node.data.id });
      }}
    />
  );
}
