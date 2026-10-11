import {
  hostStatuses,
  hosts,
  onHostStatus,
  onHostsChanged,
  openHost,
  windowHost,
  type DeskHost,
  type DeskHostStatus,
} from '@ahpd/desk-client';
import { useEffect, useRef, useState, type ReactElement } from 'react';

/**
 * The window's host, and a menu of every host with its status dot. A pick
 * moves this window to that host; the desk reloads it.
 */
export default function HostSwitcher(): ReactElement {
  const [mine, setMine] = useState<DeskHost | null>(null);
  const [list, setList] = useState<DeskHost[]>([]);
  const [statuses, setStatuses] = useState<Record<string, DeskHostStatus>>({});
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let live = true;
    void windowHost().then((host) => live && setMine(host));
    void hosts().then((all) => live && setList(all));
    void hostStatuses().then((now) => live && setStatuses(now));
    const stops = [
      onHostsChanged((all) => {
        setList(all);
        setMine((held) => all.find((host) => host.id === held?.id) ?? held);
      }),
      onHostStatus(setStatuses),
    ];
    return () => {
      live = false;
      for (const stop of stops) void stop.then((unlisten) => unlisten());
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  const dot = (id: string) => <span className={`desk-dot desk-dot--${statuses[id] ?? 'connecting'}`} aria-label={statuses[id] ?? 'connecting'} />;

  return (
    <div className="desk-host" ref={ref}>
      <button type="button" className="desk-host__button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}>
        {mine !== null && dot(mine.id)}
        <span className="desk-host__name">{mine?.name ?? '…'}</span>
        <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
          <path d="M1 2.5l3 3 3-3" fill="none" stroke="currentColor" />
        </svg>
      </button>
      {open && (
        <div className="desk-host__menu" role="menu">
          {list.map((host) => (
            <button
              key={host.id}
              type="button"
              role="menuitem"
              className="desk-host__item"
              aria-current={host.id === mine?.id}
              onClick={() => {
                setOpen(false);
                if (host.id !== mine?.id) void openHost(host.id, { replace: true });
              }}
            >
              {dot(host.id)}
              <span className="desk-host__name">{host.name}</span>
              <span className="desk-host__url">{host.url.replace(/^ws:\/\//i, '')}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
