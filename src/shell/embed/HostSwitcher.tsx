import { useEffect, useRef, useState, type ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { ContextMenu } from '@softov/scena/ui';
import type { PickerAction } from '@softov/scena/types';
import { EMOJIcon } from '../../resources/emojis.js';
import { ahpPaths, type Connection } from '../../bridges/data.js';
import { fixHost, hostState } from '../../bridges/host-state.js';
import { HOST_FILTER, setHostFilter, useEach } from '../../bridges/hosts.js';
import { embedMode, type EmbedHost, type EmbedHostStatus, type Embedder } from './index.js';

/** How bad a host's status is, so the worst one colours the every-host dot. */
const RANK: Record<EmbedHostStatus, number> = { connected: 0, connecting: 1, down: 2 };

/**
 * The window's host, and a menu of every host with its status dot. A pick
 * moves this window to that host; the embedder reloads it. Under the hosts,
 * "Manage hosts" shows the embedder's host list, and "Add host" shows it on
 * its form for a new one.
 *
 * With every host, it names the one host the lists show, or "Every host", and
 * a pick shows only that host, as the host filter does.
 */
export default function HostSwitcher({ embedder }: { embedder: Embedder }): ReactElement {
  const { t } = useI18n();
  const scena = useScena();
  const multi = embedMode() === 'multi';
  const filter = useStore<string[] | null>(HOST_FILTER) ?? null;
  const [mine, setMine] = useState<EmbedHost | null>(null);
  const [list, setList] = useState<EmbedHost[]>([]);
  const [statuses, setStatuses] = useState<Record<string, EmbedHostStatus>>({});
  const [open, setOpen] = useState(false);
  // With every host: the host whose options are open, and where.
  const [options, setOptions] = useState<{ id: string; x: number; y: number } | null>(null);
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

  // With every host, this page holds each host's connection, so the dots are its own.
  const connections = useEach<Connection>(multi ? list.map((host) => ahpPaths(host.id).connection) : []);
  const refusals = useEach<boolean>(multi ? list.map((host) => ahpPaths(host.id).refused) : []);
  const statusOf = (id: string): EmbedHostStatus => {
    if (!multi) return statuses[id] ?? 'connecting';
    const at = list.findIndex((host) => host.id === id);
    const state = hostState(connections[at], refusals[at]);
    return state === 'connected' || state === 'connecting' ? state : 'down';
  };
  const dotOf = (status: EmbedHostStatus) => <span className={`embed-dot embed-dot--${status}`} aria-label={t(`shell/embed/status/${status}`)} />;
  const dot = (id: string) => dotOf(statusOf(id));
  // With every host: the one host shown, else every host with the worst dot.
  const only = multi && filter?.length === 1 ? list.find((host) => host.id === filter[0]) ?? null : null;
  const shown = multi ? only : mine;
  const worst = list.reduce<EmbedHostStatus>((held, host) => {
    const status = statusOf(host.id);
    return RANK[status] > RANK[held] ? status : held;
  }, 'connected');
  const pick = (id: string | null): void => {
    setOpen(false);
    if (multi) setHostFilter(scena.store, id === null ? null : [id]);
    else if (id !== null && id !== mine?.id) void embedder.switchHost(id);
  };

  return (
    <div className="embed-host" ref={ref}>
      <button type="button" className="embed-host__button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}>
        {shown !== null ? dot(shown.id) : multi ? dotOf(worst) : null}
        <span className="embed-host__name">{shown?.name ?? (multi ? t('hosts/every') : '…')}</span>
        <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
          <path d="M1 2.5l3 3 3-3" fill="none" stroke="currentColor" />
        </svg>
      </button>
      {open && (
        <div className="embed-host__menu" role="menu">
          {multi ? (
            <button type="button" role="menuitem" className="embed-host__item" aria-current={only === null} onClick={() => pick(null)}>
              {dotOf(worst)}
              <span className="embed-host__name">{t('hosts/every')}</span>
            </button>
          ) : null}
          {list.map((host) => (
            <div key={host.id} className="embed-host__row">
              <button
                type="button"
                role="menuitem"
                className="embed-host__item"
                aria-current={host.id === shown?.id}
                onClick={() => pick(host.id)}
              >
                {dot(host.id)}
                <span className="embed-host__name">{host.name}</span>
                <span className="embed-host__url" title={host.url}>{host.url.replace(/^ws:\/\//i, '')}</span>
              </button>
              {multi ? (
                <button
                  type="button"
                  className="embed-host__more"
                  aria-label={t('shell/embed/hostOptions', { host: host.name })}
                  title={t('shell/embed/hostOptions', { host: host.name })}
                  onClick={(event) => {
                    // Beside the row, with the host menu still open, so the options read as that host's.
                    const box = event.currentTarget.getBoundingClientRect();
                    setOptions({ id: host.id, x: box.right + 4, y: box.top - 4 });
                  }}
                >
                  {EMOJIcon.more}
                </button>
              ) : null}
            </div>
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
      {options === null ? null : <ContextMenu spec={{ items: optionsOf(options.id) }} x={options.x} y={options.y} onClose={() => setOptions(null)} />}
    </div>
  );

  /** A host's options: its pages, Sign in or Retry while it is not connected, and the embedder's form for it. */
  function optionsOf(id: string): PickerAction[] {
    const at = list.findIndex((host) => host.id === id);
    const state = hostState(connections[at], refusals[at]);
    const item = (title: string, icon: string, fn: () => void): PickerAction => ({
      title,
      icon,
      onSelect: (menu) => {
        menu.closeMenu();
        setOptions(null);
        setOpen(false);
        fn();
      },
    });
    return [
      item(t('shell/embed/info'), EMOJIcon.info, () => void scena.commands.execute('ahp.openHostInfo', { host: id })),
      item(t('shell/embed/settings'), EMOJIcon.settings, () => void scena.commands.execute('ahp.openSettings', { host: id })),
      ...(state === 'down' || state === 'refused' ? [item(t(state === 'refused' ? 'hosts/signIn' : 'hosts/retry'), EMOJIcon.reload, () => fixHost(id, state))] : []),
      item(t('shell/embed/manage'), EMOJIcon.edit, () => void embedder.manageHosts({ edit: id })),
    ];
  }
}
