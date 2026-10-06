import { useEffect, useState, type ReactElement } from 'react';
import { useScena, useStore } from '@softov/scena/react';
import { Alert, Button, Text } from '@softov/scena/ui';
import type { AgentInfo } from '@microsoft/agent-host-protocol';
import { AHP_AGENTS, AHP_DEFAULT_DIRECTORY, request } from '../connection/data.js';
import { folderLabel, folderUri, newId } from '../connection/words.js';

/** A new session: which agent, in which folder. */
export default function NewSessionPage(): ReactElement {
  const scena = useScena();
  const agents = useStore<AgentInfo[]>(AHP_AGENTS) ?? [];
  const home = useStore<string | null>(AHP_DEFAULT_DIRECTORY);
  const [provider, setProvider] = useState('');
  const [folder, setFolder] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The first agent and the daemon's own folder, once they are known.
  useEffect(() => {
    if (provider === '' && agents[0] !== undefined) setProvider(agents[0].provider);
  }, [agents, provider]);
  useEffect(() => {
    if (folder === '' && home !== undefined && home !== null) setFolder(folderLabel(home));
  }, [home, folder]);

  const create = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    // The client names the session: its URI is the channel it is created on.
    const resource = `${provider}:/${newId()}`;
    try {
      await request('createSession', {
        channel: resource,
        provider,
        ...(folder.trim() === '' ? {} : { workingDirectories: [folderUri(folder)] }),
      });
      await scena.commands.execute('ahp.openSession', { resource });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setBusy(false);
    }
  };

  if (agents.length === 0) return <Alert tone="warning" message="This daemon offers no agent." />;
  const chosen = agents.find((one) => one.provider === provider);
  return (
    <div className="web-page">
      <Text variant="h2" text="New session" />
      <label className="web-input__group">
        <span className="web-input__label">Agent</span>
        <select className="web-field" value={provider} onChange={(event) => setProvider(event.target.value)}>
          {agents.map((one) => <option key={one.provider} value={one.provider}>{one.displayName}</option>)}
        </select>
        {chosen?.description === undefined || chosen.description === '' ? null : <span className="web-input__hint">{chosen.description}</span>}
      </label>
      <label className="web-input__group">
        <span className="web-input__label">Folder</span>
        <input className="web-field" value={folder} placeholder="/path/to/project" onChange={(event) => setFolder(event.target.value)} />
        <span className="web-input__hint">A folder on the daemon's machine.</span>
      </label>
      {error === null ? null : <Alert tone="danger" title="Not created" message={error} />}
      <div className="web-page__actions">
        <Button label="Create" variant="primary" disabled={busy || provider === ''} onClick={() => void create()} />
      </div>
    </div>
  );
}
