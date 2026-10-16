import { useEffect, useRef, type ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Alert } from '@softov/scena/ui';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import type { StateAction } from '@microsoft/agent-host-protocol';
import { ahpPaths, channelErrorPath, channelPath, hostBridge, type HostFacts } from '../../bridges/data.js';
import { clientClaim, deltaOf, foldTerminal, holderOf, joinParts, normalizeState } from './terminal.js';

/** A CSS custom property's value on an element, or the fallback. */
function cssVar(element: HTMLElement, name: string, fallback: string): string {
  const value = getComputedStyle(element).getPropertyValue(name).trim();
  return value === '' ? fallback : value;
}

/**
 * One terminal on the host, drawn by xterm. Its state is followed like any
 * channel; the screen is written only the new tail of the output. Keys go to
 * the host as `terminal/input` and nothing is echoed, except on a terminal
 * without a pty (`isPty: false`), where nothing on the other end echoes.
 */
export default function TerminalPage({ host, uri }: { host: string; uri?: string }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const holder = useRef<HTMLDivElement>(null);
  const raw = useStore<unknown>(channelPath(host, uri ?? ''));
  const error = useStore<string | null>(channelErrorPath(host, uri ?? ''));
  const facts = useStore<HostFacts | null>(ahpPaths(host).host);
  const clientId = facts?.clientId ?? null;
  const state = raw === undefined ? null : normalizeState(raw);
  const owner = state === null ? null : holderOf(state.claim, clientId);
  const exited = state?.lifecycle.status === 'exited';
  const detached = (useStore<string[]>(ahpPaths(host).detached) ?? []).includes(uri ?? '');
  /** Whether typing reaches the terminal: it is ours, still running, and followed. */
  const typing = owner?.kind === 'you' && !exited && !detached;
  const typingRef = useRef(typing);
  typingRef.current = typing;

  useEffect(() => (uri === undefined || detached ? undefined : hostBridge(host).follow(uri, foldTerminal)), [host, uri, detached]);

  useEffect(() => {
    const container = holder.current;
    if (container === null || uri === undefined) return;
    const term = new Terminal({
      fontFamily: cssVar(container, '--oo-font-mono', 'ui-monospace, SFMono-Regular, Menlo, monospace'),
      fontSize: 13,
      cursorBlink: true,
      scrollback: 5_000,
      theme: {
        background: cssVar(container, '--oo-color-canvas', '#1e1e1e'),
        foreground: cssVar(container, '--oo-color-text', '#d4d4d4'),
        cursor: cssVar(container, '--oo-color-accent', '#d4d4d4'),
      },
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.loadAddon(new WebLinksAddon());
    term.open(container);

    /** The stream as far as the screen has drawn it. */
    let drawn = '';
    /** True on a terminal with no pty: this client echoes, and sends Enter as a newline. */
    let discipline = false;

    const draw = (value: unknown): void => {
      if (value === undefined) return;
      const next = normalizeState(value);
      discipline = next.isPty === false;
      const delta = deltaOf(drawn, joinParts(next.content));
      if (delta.reset) term.reset();
      if (delta.text !== '') term.write(delta.text);
      drawn = delta.reset ? delta.text : drawn + delta.text;
    };
    draw(scena.store.get(channelPath(host, uri)));
    const watch = scena.store.subscribe(channelPath(host, uri), () => draw(scena.store.get(channelPath(host, uri))));

    const send = (action: { type: string } & Record<string, unknown>): void => hostBridge(host).dispatch(uri, action as unknown as StateAction);
    const input = term.onData((data) => {
      if (!typingRef.current) return;
      send({ type: 'terminal/input', data: discipline ? data.replaceAll('\r', '\n') : data });
      if (!discipline) return;
      if (data === '\r') term.write('\r\n');
      else if (data === '\u{7F}') term.write('\b \b');
      else term.write(data);
    });

    let size = '';
    const resize = (): void => {
      if (container.clientWidth === 0 || container.clientHeight === 0) return;
      fit.fit();
      const next = `${term.cols}x${term.rows}`;
      if (next === size || !typingRef.current) return;
      size = next;
      send({ type: 'terminal/resized', cols: term.cols, rows: term.rows });
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    term.focus();

    return () => {
      observer.disconnect();
      input.dispose();
      watch.dispose();
      term.dispose();
    };
  }, [scena, host, uri]);

  if (uri === undefined) return <Alert tone="warning" message={t('terminals/noTerminal')} />;
  const takeOver = (): void => {
    if (clientId !== null) hostBridge(host).dispatch(uri, { type: 'terminal/claimed', claim: clientClaim(clientId) } as unknown as StateAction);
  };
  return (
    <div className="web-terminal">
      {error === null || error === undefined ? null : <Alert tone="danger" title={t('terminals/notReadable')} message={error} />}
      {detached ? (
        <div className="web-terminal__note">
          {t('terminals/disconnected')}
          <button type="button" className="web-tool__copy" onClick={() => void scena.commands.execute('ahp.connectTerminal', { uri })}>{t('terminals/connect')}</button>
        </div>
      ) : state === null || typing ? null : (
        <div className="web-terminal__note">
          {exited
            ? typeof (state.lifecycle as { exitCode?: number }).exitCode === 'number'
              ? t('terminals/note/exitedWith', { code: (state.lifecycle as { exitCode: number }).exitCode })
              : t('terminals/note/exited')
            : t(owner?.kind === 'session' ? 'terminals/note/session' : 'terminals/note/another')}
          {exited || clientId === null ? null : <button type="button" className="web-tool__copy" onClick={takeOver}>{t('terminals/takeOver')}</button>}
        </div>
      )}
      <div className="web-terminal__screen" ref={holder} />
    </div>
  );
}
