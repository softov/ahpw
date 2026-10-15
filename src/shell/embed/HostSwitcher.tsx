import { useEffect, useRef, useState, type ReactElement } from 'react';
import { useI18n } from '@softov/scena/react';
import type { EmbedHost, EmbedHostStatus, Embedder } from './index.js';

/**
 * The window's host, and a menu of every host with its status dot. A pick
 * moves this window to that host; the embedder reloads it. Under the hosts,
 * "Manage hosts" shows the embedder's host list, and "Add host" shows it on
 * its form for a new one.
 */
export default function HostSwitcher({ embedder }: { embedder: Embedder }): ReactElement {
  const { t } = useI18n();
  const [mine, setMine] = useState<EmbedHost | null>(null);
  const [list, setList] = useState<EmbedHost[]>([]);
  const [statuses, setStatuses] = useState<Record<string, EmbedHostStatus>>({});
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let live = true;
    void embedder.host().then((host) => live && setMine(host));
    void embedder.hosts().then((all) => live && setList(all));
    void embedder.statuses().then((now) => live && setStatuses(now));
    const stops = [
      embedder.onHosts((all) => {
        setList(all);
        setMine((held) => all.find((host) => host.id === held?.id) ?? held);
      }),
      embedder.onStatuses(setStatuses),
    ];
    return () => {
      live = false;
      for (const stop of stops) stop();
    };
  }, [embedder]);

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

  const dot = (id: string) => <span className={`embed-dot embed-dot--${statuses[id] ?? 'connecting'}`} aria-label={t(`shell/embed/status/${statuses[id] ?? 'connecting'}`)} />;

  return (
    <div className="embed-host" ref={ref}>
      <button type="button" className="embed-host__button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}>
        {mine !== null && dot(mine.id)}
        <span className="embed-host__name">{mine?.name ?? '…'}</span>
        <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
          <path d="M1 2.5l3 3 3-3" fill="none" stroke="currentColor" />
        </svg>
      </button>
      {open && (
        <div className="embed-host__menu" role="menu">
          {list.map((host) => (
            <button
              key={host.id}
              type="button"
              role="menuitem"
              className="embed-host__item"
              aria-current={host.id === mine?.id}
              onClick={() => {
                setOpen(false);
                if (host.id !== mine?.id) void embedder.switchHost(host.id);
              }}
            >
              {dot(host.id)}
              <span className="embed-host__name">{host.name}</span>
              <span className="embed-host__url">{host.url.replace(/^ws:\/\//i, '')}</span>
            </button>
          ))}
          <div className="embed-host__line" role="separator" />
          <button
            type="button"
            role="menuitem"
            className="embed-host__item embed-host__action"
            onClick={() => {
              setOpen(false);
              void embedder.manageHosts();
            }}
          >
            <span aria-hidden="true">☰</span>
            <span className="embed-host__name">{t('shell/embed/manageHosts')}</span>
          </button>
          <button
            type="button"
            role="menuitem"
            className="embed-host__item embed-host__action"
            onClick={() => {
              setOpen(false);
              void embedder.manageHosts({ add: true });
            }}
          >
            <span aria-hidden="true">+</span>
            <span className="embed-host__name">{t('shell/embed/addHost')}</span>
          </button>
        </div>
      )}
    </div>
  );
}
