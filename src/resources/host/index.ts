import type { BindingPath, Disposable, ReactiveStore, Scena } from '@softov/scena/types';
import { PALETTE_SLOT } from '../../shell/CommandPalette.js';
import { combineDisposables, translate, type ModusClass } from '@softov/scena';
import { bound, english } from '../../i18n/locales.js';
import { hideOverlaidSidebar } from '../sessions/index.js';
import { EMOJIcon } from '../emojis.js';
import { windowHost } from '../../bridges/data.js';
import { hostNameOf, shownHosts } from '../../bridges/hosts.js';
import { embedMode } from '../../shell/embed/index.js';

/** Arguments of the commands that open a host's page; the window's host by default. */
export interface HostArgs {
  host?: string;
}

/** The host a page opens on when none is named: the window's, or with every host the first the filter shows. */
const pageHost = (store: ReactiveStore): string | undefined => (embedMode() === 'multi' ? shownHosts(store)[0] : windowHost());

/** The display size class the modus backend publishes. */
const MODUS_CLASS = '$/modus/class' as BindingPath;

/** The host's information and settings, at the foot of the activity bar. */
export function registerHost(scena: Scena): Disposable {
  return combineDisposables(
    scena.components.register({
      component: 'HostSettingsPage',
      category: 'page',
      props: { icon: EMOJIcon.settings },
      renderer: { kind: 'react', load: () => import('./Settings.js') },
    }),
    scena.components.register({
      component: 'HostInfoPage',
      category: 'page',
      props: { icon: EMOJIcon.host },
      renderer: { kind: 'react', load: () => import('./Info.js') },
    }),
    scena.commands.register({
      id: 'ahp.openHostInfo',
      title: () => translate('host/commands/info'),
      keywords: [english('host/commands/info')],
      category: 'Host',
      slots: [PALETTE_SLOT],
      run: (ctx, args) => {
        const host = (args as HostArgs | undefined)?.host ?? pageHost(ctx.store);
        if (host === undefined) return;
        const title = embedMode() === 'multi' ? translate('hosts/infoTab', { host: hostNameOf(ctx.store, host) }) : bound('host/title');
        ctx.surfaces.open({ surface: 'main', key: `host:info:${host}`, resource: { component: 'HostInfoPage', host }, props: { title } });
        hideOverlaidSidebar(ctx.scena, ctx.store.get<ModusClass>(MODUS_CLASS) ?? 'large');
      },
    }),
    scena.commands.register({
      id: 'ahp.openSettings',
      title: () => translate('host/commands/settings'),
      keywords: [english('host/commands/settings')],
      category: 'Host',
      slots: [PALETTE_SLOT],
      run: (ctx, args) => {
        const host = (args as HostArgs | undefined)?.host ?? pageHost(ctx.store);
        if (host === undefined) return;
        const title = embedMode() === 'multi' ? translate('hosts/settingsTab', { host: hostNameOf(ctx.store, host) }) : bound('host/settings/tab');
        ctx.surfaces.open({ surface: 'main', key: `host:settings:${host}`, resource: { component: 'HostSettingsPage', host }, props: { title } });
        hideOverlaidSidebar(ctx.scena, ctx.store.get<ModusClass>(MODUS_CLASS) ?? 'large');
      },
    }),
  );
}
