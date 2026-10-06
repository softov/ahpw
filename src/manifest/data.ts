import type { BindingPath, DataProviderDefinition } from '@softov/scena/types';
import { readManifest } from '../api.js';

/** The manifest, once read. */
export const MANIFEST = '$/ahpd/manifest' as BindingPath;
/** Why the manifest could not be read, or null. */
export const MANIFEST_ERROR = '$/ahpd/manifestError' as BindingPath;
/** The id of the command open in `main`. */
export const ACTIVE_COMMAND = '$/ahpd/active' as BindingPath;

/** Where one command's last run is kept. */
export const runPath = (id: string): BindingPath => `$/ahpd/runs/${id}` as BindingPath;

/** One command's last run. */
export type Run =
  | { state: 'running' }
  | { state: 'done'; data: unknown; at: number }
  | { state: 'failed'; status: number; message: string; at: number };

export const manifestProvider: DataProviderDefinition = {
  namespace: 'ahpd',
  load: 'eager',
  provider: {
    async load(store) {
      try {
        store.set(MANIFEST, await readManifest());
        store.set(MANIFEST_ERROR, null);
      } catch (error) {
        store.set(MANIFEST_ERROR, error instanceof Error ? error.message : String(error));
      }
    },
    unload(store) {
      store.clearNamespace('ahpd');
    },
  },
};
