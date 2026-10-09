import type { Disposable, Scena } from '@softov/scena/types';
import { combineDisposables } from '@softov/scena';
import { AHP_CONNECTION, ahpProvider, reconnect, type Connection } from './data.js';
import ConnectionStatus from './Status.js';
import { done, tryNotify } from '../notify/index.js';

/** The notification that stands while the connection is lost. */
const LOST = 'ahp:connection';

/** Says when a connection that was up goes down, and when it comes back. */
function watchConnection(scena: Scena): Disposable {
  let lost = false;
  let wasUp = false;
  return scena.store.subscribe(AHP_CONNECTION, () => {
    const connection = scena.store.get<Connection>(AHP_CONNECTION);
    if (connection === undefined) return;
    if (connection.status === 'connected') {
      if (lost) {
        tryNotify((notifications) => notifications.dismiss(LOST));
        done('Connected to the server again', { source: LOST });
      }
      lost = false;
      wasUp = true;
      return;
    }
    if (!wasUp || lost || connection.status === 'connecting') return;
    lost = true;
    tryNotify((notifications) => notifications.publish({
      id: LOST,
      type: 'connection.lost',
      tone: 'warning',
      title: 'Lost the connection to the server',
      ...(connection.error === null ? {} : { description: connection.error }),
      dismissAuto: false,
      alert: { title: 'Lost the connection to the server' },
      actions: [{ label: 'Retry now', command: 'ahp.reconnect', dismisses: false }],
      source: LOST,
    }));
  });
}

/** The AHP connection to the host that served this page, and its status bar item. */
export function registerConnection(scena: Scena): Disposable {
  return combineDisposables(
    scena.store.registerDataProvider(ahpProvider),
    watchConnection(scena),
    scena.commands.register({ id: 'ahp.reconnect', title: 'Reconnect to the server', run: () => reconnect() }),
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
