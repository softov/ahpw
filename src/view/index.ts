import type { Disposable, Scena } from '@softov/scena/types';
import { combineDisposables } from '@softov/scena';
import LayoutSelect from './LayoutSelect.js';
import { MAIN_LAYOUTS, readLayout, writeLayout } from './layouts.js';

/** The theme picker and the main area's layout, in the title bar. */
export function registerView(scena: Scena): Disposable {
  const held = readLayout();
  if (held !== null) scena.layout.setSurface('main', { ...scena.layout.get().surfaces.main, layout: held });
  return combineDisposables(
    scena.commands.register({
      id: 'view.setMainLayout',
      title: 'Set the main layout',
      run: (ctx, args) => {
        const layout = (args as { layout?: string } | undefined)?.layout;
        if (layout === undefined || !MAIN_LAYOUTS.some((one) => one.id === layout)) return;
        ctx.scena.layout.setSurface('main', { ...ctx.scena.layout.get().surfaces.main, layout });
        writeLayout(layout);
      },
    }),
    scena.components.register({
      component: 'LayoutSelect',
      category: 'inline',
      renderer: { kind: 'react', load: async () => ({ default: LayoutSelect as unknown }) },
    }),
    scena.surfaces.mount({
      surface: 'titlebar',
      key: 'chrome:layout',
      resource: { component: 'LayoutSelect', slot: 'right' },
    }),
    scena.surfaces.mount({
      surface: 'titlebar',
      key: 'chrome:theme',
      resource: { component: 'ThemePicker', slot: 'right', compact: true },
    }),
  );
}
