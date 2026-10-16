import type { Disposable, Scena } from '@softov/scena/types';
import { combineDisposables, translate } from '@softov/scena';
import { english } from '../i18n/locales.js';
import { ahpPaths, ahpProvider, hostBridge, windowHost, type Connection } from './data.js';
import { everyHost, hostNameOf, onEachHost } from './hosts.js';
import { embedMode } from '../shell/embed/index.js';
import ConnectionStatus from './Status.js';
import { done, tryNotify } from '../shell/notify/index.js';

/** The notification that stands while a host's connection is lost. */
const LOST = 'ahp:connection';

/** Says when the host `host`'s connection that was up goes down, and when it comes back; with every host, the words name it. */
function watchConnection(scena: Scena, host: string): Disposable {
  const id = embedMode() === 'multi' ? `${LOST}:${host}` : LOST;
  const named = (key: string): string => (embedMode() === 'multi' ? translate(`${key}Host`, { host: hostNameOf(scena.store, host) }) : translate(key));
  let lost = false;
  let wasUp = false;
  return scena.store.subscribe(ahpPaths(host).connection, () => {
    const connection = scena.store.get<Connection>(ahpPaths(host).connection);
    if (connection === undefined) return;
    if (connection.status === 'connected') {
      if (lost) {
        tryNotify((notifications) => notifications.dismiss(id));
        done(named('bridges/backAgain'), { source: id });
      }
      lost = false;
      wasUp = true;
      return;
    }
    if (!wasUp || lost || connection.status === 'connecting') return;
    lost = true;
    tryNotify((notifications) => notifications.publish({
      id,
      type: 'connection.lost',
      tone: 'warning',
      title: named('bridges/lost'),
      ...(connection.error === null ? {} : { description: connection.error }),
      dismissAuto: false,
      alert: { title: named('bridges/lost') },
      actions: [{ label: translate('bridges/retryNow'), command: 'ahp.reconnect', args: { host }, dismisses: false }],
      source: id,
    }));
  });
}

/** The AHP connection to the host that served this page, and its status bar item. */
export function registerConnection(scena: Scena): Disposable {
  return combineDisposables(
    scena.store.registerDataProvider(ahpProvider),
    onEachHost(scena, (host) => watchConnection(scena, host)),
    // Without a host, every host that is not connected is tried again.
    scena.commands.register({
      id: 'ahp.reconnect',
      title: () => translate('bridges/commands/reconnect'),
      keywords: [english('bridges/commands/reconnect')],
      run: async (ctx, args) => {
        const host = (args as { host?: string } | undefined)?.host;
        const hosts = host !== undefined ? [host] : embedMode() === 'multi' ? everyHost(ctx.store).filter((one) => ctx.store.get<Connection>(ahpPaths(one).connection)?.status !== 'connected') : [windowHost()];
        await Promise.all(hosts.map((one) => hostBridge(one).reconnect()));
      },
    }),
    scena.components.register({
      component: 'ConnectionStatus',
      category: 'inline',
      renderer: { kind: 'react', load: async () => ({ default: ConnectionStatus as unknown }) },
    }),
    scena.surfaces.mount({
      surface: 'statusbar',
      key: 'ahp:connection',
      resource: { component: 'ConnectionStatus', slot: 'left' },
    }),
  );
}
