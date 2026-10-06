import type { Disposable, Scena } from '@softov/scena/types';
import { ahpProvider } from './data.js';

/** The AHP connection to the daemon that served this page. */
export function registerConnection(scena: Scena): Disposable {
  return scena.store.registerDataProvider(ahpProvider);
}
