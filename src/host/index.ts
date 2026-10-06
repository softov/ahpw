import type { BindingPath, Disposable, Scena } from '@softov/scena/types';
import { PALETTE_SLOT } from '../view/Palette.js';
import { combineDisposables, type ModusClass } from '@softov/scena';
import { hideOverlaidSidebar } from '../sessions/index.js';
import SettingsPage from './Settings.js';

/** The display size class the modus backend publishes. */
const MODUS_CLASS = '$/modus/class' as BindingPath;

/** The host's settings, at the foot of the activity bar. */
export function registerHost(scena: Scena): Disposable {
  return combineDisposables(
    scena.components.register({
      component: 'HostSettingsPage',
      category: 'page',
      renderer: { kind: 'react', load: async () => ({ default: SettingsPage as unknown }) },
    }),
    scena.commands.register({
      id: 'ahp.openSettings',
      title: 'Host settings',
      category: 'Host',
      slots: [PALETTE_SLOT],
      run: (ctx) => {
        ctx.surfaces.open({ surface: 'main', key: 'host:settings:page', resource: { component: 'HostSettingsPage' }, props: { title: 'Settings' } });
        hideOverlaidSidebar(ctx.scena, ctx.store.get<ModusClass>(MODUS_CLASS) ?? 'large');
      },
    }),
    scena.surfaces.mount({
      surface: 'activitybar',
      key: 'host:settings:nav',
      resource: { component: 'ActivityBarItem', icon: '\u{2699}\u{FE0F}', label: 'Settings', pos: 'bottom', command: 'ahp.openSettings' },
    }),
  );
}
