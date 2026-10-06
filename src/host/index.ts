import type { BindingPath, Disposable, Scena } from '@softov/scena/types';
import { PALETTE_SLOT } from '../view/Palette.js';
import { combineDisposables, type ModusClass } from '@softov/scena';
import { hideOverlaidSidebar } from '../sessions/index.js';
import SettingsPage from './Settings.js';
import HostInfoPage from './Info.js';

/** The display size class the modus backend publishes. */
const MODUS_CLASS = '$/modus/class' as BindingPath;

/** The host's information and settings, at the foot of the activity bar. */
export function registerHost(scena: Scena): Disposable {
  return combineDisposables(
    scena.components.register({
      component: 'HostSettingsPage',
      category: 'page',
      renderer: { kind: 'react', load: async () => ({ default: SettingsPage as unknown }) },
    }),
    scena.components.register({
      component: 'HostInfoPage',
      category: 'page',
      renderer: { kind: 'react', load: async () => ({ default: HostInfoPage as unknown }) },
    }),
    scena.commands.register({
      id: 'ahp.openHostInfo',
      title: 'Host information',
      category: 'Host',
      slots: [PALETTE_SLOT],
      run: (ctx) => {
        ctx.surfaces.open({ surface: 'main', key: 'host:info:page', resource: { component: 'HostInfoPage' }, props: { title: 'Host' } });
        hideOverlaidSidebar(ctx.scena, ctx.store.get<ModusClass>(MODUS_CLASS) ?? 'large');
      },
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
      key: 'host:info:nav',
      resource: { component: 'ActivityBarItem', icon: '\u{2139}\u{FE0F}', label: 'Host', pos: 'bottom', command: 'ahp.openHostInfo' },
    }),
    scena.surfaces.mount({
      surface: 'activitybar',
      key: 'host:settings:nav',
      resource: { component: 'ActivityBarItem', icon: '\u{2699}\u{FE0F}', label: 'Settings', pos: 'bottom', command: 'ahp.openSettings' },
    }),
  );
}
