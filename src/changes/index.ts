import type { Disposable, Scena } from '@softov/scena/types';
import { combineDisposables } from '@softov/scena';
import { mountRight } from '../right-sidebar.js';
import { EMOJIcon } from '../emojis.js';

/** What the open session changed, in the right sidebar. */
export function registerChanges(scena: Scena): Disposable {
  return combineDisposables(
    scena.components.register({
      component: 'ChangesExplorer',
      category: 'page',
      renderer: { kind: 'react', load: () => import('./Explorer.js') },
    }),
    mountRight(scena, { key: 'changes:explorer', resource: { component: 'ChangesExplorer' }, props: { title: 'Changes' } }, EMOJIcon.diff),
  );
}
