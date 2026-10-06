import type { Disposable, Scena } from '@softov/scena/types';
import { combineDisposables } from '@softov/scena';
import ChangesExplorer from './Explorer.js';

/** What the open session changed, in the right sidebar. */
export function registerChanges(scena: Scena): Disposable {
  return combineDisposables(
    scena.components.register({
      component: 'ChangesExplorer',
      category: 'page',
      renderer: { kind: 'react', load: async () => ({ default: ChangesExplorer as unknown }) },
    }),
    scena.surfaces.mount({
      surface: 'sidebar:right',
      key: 'changes:explorer',
      resource: { component: 'ChangesExplorer' },
      props: { title: 'Changes' },
    }),
  );
}
