import type { Disposable, Scena } from '@softov/scena/types';
import { combineDisposables } from '@softov/scena';
import { mountRight } from '../right-sidebar.js';
import { EMOJIcon } from '../../resources/emojis.js';

/** The Browser view, a web page in the right sidebar. */
export function registerBrowser(scena: Scena): Disposable {
  return combineDisposables(
    scena.components.register({
      component: 'BrowserView',
      category: 'page',
      renderer: { kind: 'react', load: () => import('./BrowserView.js') },
    }),
    mountRight(scena, { key: 'shell:browser', resource: { component: 'BrowserView' }, props: { title: { t: 'shell/browser/tab' } } }, EMOJIcon.web),
  );
}
