import type { BindingPath, Disposable, Scena } from '@softov/scena/types';
import { PALETTE_SLOT } from '../view/Palette.js';
import { combineDisposables, type ModusClass } from '@softov/scena';
import { hideOverlaidSidebar } from '../sessions/index.js';
import { ICONS } from '../icons.js';

/** The display size class the modus backend publishes. */
const MODUS_CLASS = '$/modus/class' as BindingPath;

/** The host's information and settings, at the foot of the activity bar. */
export function registerHost(scena: Scena): Disposable {
  return combineDisposables(
    scena.components.register({
      component: 'HostSettingsPage',
      category: 'page',
      renderer: { kind: 'react', load: () => import('./Settings.js') },
    }),
    scena.components.register({
      component: 'HostInfoPage',
      category: 'page',
      renderer: { kind: 'react', load: () => import('./Info.js') },
    }),
    scena.commands.register({
      id: 'ahp.openHostInfo',
      title: 'Host information',
      category: 'Host',
      slots: [PALETTE_SLOT],
      run: (ctx) => {
        ctx.surfaces.open({ surface: 'main', key: 'host:info:page', resource: { component: 'HostInfoPage' }, props: { title: 'Host', icon: ICONS.host } });
        hideOverlaidSidebar(ctx.scena, ctx.store.get<ModusClass>(MODUS_CLASS) ?? 'large');
      },
    }),
    scena.commands.register({
      id: 'ahp.openSettings',
      title: 'Host settings',
      category: 'Host',
      slots: [PALETTE_SLOT],
      run: (ctx) => {
        ctx.surfaces.open({ surface: 'main', key: 'host:settings:page', resource: { component: 'HostSettingsPage' }, props: { title: 'Settings', icon: ICONS.settings } });
        hideOverlaidSidebar(ctx.scena, ctx.store.get<ModusClass>(MODUS_CLASS) ?? 'large');
      },
    }),
  );
}
