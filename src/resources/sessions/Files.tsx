import { useMemo, useState, type ReactElement } from 'react';
import { useI18n, useStore } from '@softov/scena/react';
import type { SessionSummary } from '@microsoft/agent-host-protocol';
import { ahpPaths } from '../../bridges/data.js';
import { HostFolders } from '../folders/Explorer.js';
import { ACTIVE_SESSION, type ActiveSession } from './state.js';

/** The focused session's folder as a tree, for the right sidebar. */
export default function SessionFiles(): ReactElement {
  const { t } = useI18n();
  const active = useStore<ActiveSession>(ACTIVE_SESSION);
  const at = active?.host ?? '';
  const sessions = useStore<SessionSummary[]>(ahpPaths(at).sessions);
  const summary = sessions?.find((one) => one.resource === active?.resource);
  const folder = summary?.workingDirectories?.[0];
  const roots = useMemo(() => (folder === undefined ? [] : [folder]), [folder]);
  const [selected, setSelected] = useState<string | null>(null);
  if (summary === undefined) return <p className="web-note web-details__empty">{t('sessions/files/noSession')}</p>;
  if (folder === undefined) return <p className="web-note web-details__empty">{t('sessions/files/noFolder')}</p>;
  return (
    <div className="web-explorer">
      <div className="web-explorer__scroll">
        {/* Keyed by the folder, so another session's tree starts with its own folder open. */}
        <HostFolders key={`${at} ${folder}`} host={at} named={null} selected={selected} onSelected={setSelected} rooted={roots} />
      </div>
    </div>
  );
}
