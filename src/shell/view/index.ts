import type { Disposable, Scena } from '@softov/scena/types';
import { combineDisposables, translate } from '@softov/scena';
import { english } from '../../i18n/locales.js';
import { MAIN_LAYOUTS, readLayout, writeLayout } from './layouts.js';

/** The main area's layout, kept per browser. */
export function registerView(scena: Scena): Disposable {
  const held = readLayout();
  if (held !== null) scena.layout.setSurface('main', { ...scena.layout.get().surfaces.main, layout: held });
  return combineDisposables(
    scena.commands.register({
      id: 'view.setMainLayout',
      title: () => translate('shell/view/setMainLayout'),
      keywords: [english('shell/view/setMainLayout')],
      run: (ctx, args) => {
        const layout = (args as { layout?: string } | undefined)?.layout;
        if (layout === undefined || !MAIN_LAYOUTS.some((one) => one.id === layout)) return;
        ctx.scena.layout.setSurface('main', { ...ctx.scena.layout.get().surfaces.main, layout });
        writeLayout(layout);
      },
    }),
  );
}
