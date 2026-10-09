import type { Disposable, Scena } from '@softov/scena/types';
import { combineDisposables } from '@softov/scena';

/** What the open session changed, in the right sidebar. */
export function registerChanges(scena: Scena): Disposable {
  return combineDisposables(
    scena.components.register({
      component: 'ChangesExplorer',
      category: 'page',
      renderer: { kind: 'react', load: () => import('./Explorer.js') },
    }),
    scena.surfaces.mount({
      surface: 'sidebar:right',
      key: 'changes:explorer',
      resource: { component: 'ChangesExplorer' },
      props: { title: 'Changes' },
    }),
  );
}
