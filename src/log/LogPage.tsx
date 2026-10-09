import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent, type ReactElement } from 'react';
import { useScena } from '@softov/scena/react';
import type { Scena } from '@softov/scena/types';
import type { SessionSummary } from '@microsoft/agent-host-protocol';
import { AHP_SESSIONS } from '../connection/data.js';
import { clock, filterLog, LOG_LEVELS, LOG_SCOPES, lineText, logText, piecesOf, useLog, type LogEntry, type LogLevel, type LogScope } from './log.js';
import { EMOJIcon } from '../emojis.js';

const MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
const FOLLOW_TIP = MAC ? 'Cmd+click to open' : 'Ctrl+click to open';

const SCOPE_LABEL: Record<LogScope, string> = {
  connection: 'Connection',
  session: 'Session',
  terminal: 'Terminal',
  traffic: 'Traffic',
};

/** What a URI in a line opens, or null when the page knows nothing it names. */
function followOf(scena: Scena, uri: string): { tip: string; run: () => void } | null {
  if (uri.startsWith('ahp-terminal:')) {
    return { tip: 'Open the terminal', run: () => void scena.commands.execute('ahp.openTerminal', { uri }) };
  }
  const sessions = scena.store.get<SessionSummary[]>(AHP_SESSIONS) ?? [];
  if (sessions.some((one) => one.resource === uri)) {
    return { tip: 'Open the session', run: () => void scena.commands.execute('ahp.openSession', { resource: uri }) };
  }
  if (uri.startsWith('file:')) return { tip: 'Open the file', run: () => void scena.commands.execute('ahp.openFile', { uri }) };
  if (/^https?:/i.test(uri)) return { tip: 'Open the page', run: () => void window.open(uri, '_blank', 'noopener') };
  return null;
}

/** A line's detail as text: a frame pretty-printed, anything else as JSON. */
function detailText(detail: unknown): string {
  if (typeof detail === 'string') {
    try {
      return JSON.stringify(JSON.parse(detail), null, 2);
    } catch {
      return detail;
    }
  }
  return JSON.stringify(detail, null, 2) ?? String(detail);
}

const copy = (text: string): void => void navigator.clipboard?.writeText(text).catch(() => undefined);

const Row = memo(function Row({ entry, open, onToggle }: { entry: LogEntry; open: boolean; onToggle: (id: string) => void }): ReactElement {
  const scena = useScena();
  const words = piecesOf(entry.text).map((piece, index) => {
    if (piece.kind === 'text') return <span key={index}>{piece.text}</span>;
    const follow = followOf(scena, piece.text);
    if (follow === null) return <span key={index}>{piece.text}</span>;
    const onClick = (event: MouseEvent): void => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.stopPropagation();
      follow.run();
    };
    return <a key={index} className="web-log__link" title={`${follow.tip} (${FOLLOW_TIP})`} onClick={onClick}>{piece.text}</a>;
  });
  return (
    <div className="web-log__row" data-open={open || undefined} data-level={entry.level}>
      <div className="web-log__line" role="button" tabIndex={0} aria-expanded={open} onClick={() => onToggle(entry.id)} onKeyDown={(event) => { if (event.key === 'Enter') onToggle(entry.id); }}>
        <span className="web-log__caret">{open ? EMOJIcon.caretDown : EMOJIcon.caretRight}</span>
        <span className="web-log__time">{clock(entry.at)}</span>
        <span className="web-log__level">{entry.level.toUpperCase()}</span>
        <span className="web-log__scope" data-scope={entry.scope}><span>{SCOPE_LABEL[entry.scope]}</span></span>
        <span className="web-log__text">{words}</span>
        {open ? <button type="button" className="web-log__icon" title="Copy the line" onClick={(event) => { event.stopPropagation(); copy(lineText(entry)); }}>{EMOJIcon.copy}</button> : null}
      </div>
      {open && entry.detail !== undefined ? <pre className="web-log__detail">{detailText(entry.detail)}</pre> : null}
    </div>
  );
});

/** The page's log, filtered by scope, level and words, one line per event; a line opens in place. */
export default function LogPage(): ReactElement {
  const all = useLog();
  const [scopes, setScopes] = useState<LogScope[]>([]);
  const [minLevel, setMinLevel] = useState<LogLevel>('info');
  const [query, setQuery] = useState('');
  const [opened, setOpened] = useState<ReadonlySet<string>>(new Set());

  // Everything but the wire when no scope is picked: every frame is a line, and
  // it would bury the rest. Traffic is shown when it is asked for, whatever the level.
  const shown = useMemo(() => filterLog(all, {
    scopes: scopes.length === 0 ? LOG_SCOPES.filter((one) => one !== 'traffic') : scopes,
    minLevel: scopes.includes('traffic') ? 'debug' : minLevel,
    query,
  }), [all, scopes, minLevel, query]);

  const toggle = useCallback((id: string) => {
    setOpened((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const pick = (scope: LogScope): void =>
    setScopes((current) => (current.includes(scope) ? current.filter((one) => one !== scope) : [...current, scope]));
  const nextLevel = (): void => setMinLevel(LOG_LEVELS[(LOG_LEVELS.indexOf(minLevel) + 1) % LOG_LEVELS.length] ?? 'info');

  // Stay at the end while the reader is at the end.
  const list = useRef<HTMLDivElement>(null);
  const atEnd = useRef(true);
  useEffect(() => {
    const el = list.current;
    if (el === null) return;
    const onScroll = (): void => { atEnd.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24; };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);
  useLayoutEffect(() => {
    const el = list.current;
    if (el !== null && atEnd.current) el.scrollTop = el.scrollHeight;
  }, [shown]);

  return (
    <div className="web-log">
      <div className="web-log__bar">
        <button type="button" className="web-log__chip" data-on={scopes.length === 0 || undefined} onClick={() => setScopes([])}>All</button>
        {LOG_SCOPES.map((scope) => (
          <button key={scope} type="button" className="web-log__chip" data-on={scopes.includes(scope) || undefined} onClick={() => pick(scope)}>
            <span className="web-log__dot" data-scope={scope} />{SCOPE_LABEL[scope]}
          </button>
        ))}
        <span className="web-log__rule" />
        <button type="button" className="web-log__chip" title="Least severe level shown" disabled={scopes.includes('traffic')} onClick={nextLevel}>
          {scopes.includes('traffic') ? 'debug' : minLevel} and up
        </button>
        <input className="web-log__search" type="search" placeholder="Filter (!word excludes)" value={query} onChange={(event) => setQuery(event.target.value)} />
        <button type="button" className="web-log__icon" title="Copy the lines shown" onClick={() => copy(logText(shown))}>{EMOJIcon.copy}</button>
      </div>
      <div className="web-log__list" ref={list}>
        {shown.length === 0 ? <p className="web-note">Nothing logged{all.length === 0 ? ' yet' : ' matches the filter'}.</p> : null}
        {shown.map((entry) => <Row key={entry.id} entry={entry} open={opened.has(entry.id)} onToggle={toggle} />)}
      </div>
    </div>
  );
}
