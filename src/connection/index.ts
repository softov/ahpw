import type { Disposable, Scena } from '@softov/scena/types';
import { combineDisposables } from '@softov/scena';
import { ahpProvider } from './data.js';
import ConnectionStatus from './Status.js';

/** The AHP connection to the daemon that served this page, and its status bar item. */
export function registerConnection(scena: Scena): Disposable {
  return combineDisposables(
    scena.store.registerDataProvider(ahpProvider),
    scena.components.register({
      component: 'ConnectionStatus',
      category: 'inline',
      renderer: { kind: 'react', load: async () => ({ default: ConnectionStatus as unknown }) },
    }),
    scena.surfaces.mount({
      surface: 'statusbar',
      key: 'ahp:connection',
      resource: { component: 'ConnectionStatus', slot: 'right' },
    }),
  );
}
