import type { BindingPath, Disposable, ReactiveStore, Scena } from '@softov/scena/types';
import { PALETTE_SLOT } from '../../shell/CommandPalette.js';
import { combineDisposables, translate, type ModusClass } from '@softov/scena';
import { bound, english } from '../../i18n/locales.js';
import { hideOverlaidSidebar } from '../sessions/index.js';
import { EMOJIcon } from '../emojis.js';
import { windowHost } from '../../bridges/data.js';
import { hostNameOf, shownHosts } from '../../bridges/hosts.js';
import { embedMode } from '../../shell/embed/index.js';
import { keepSettingsTab, openSettingsAt, PLACES, placeItems, settingsHostOf, settingsPlace, type SettingsPlace } from './place.js';
import { openPalette } from '../../shell/CommandPalette.js';
import { STRIP_SLOT } from '../../shell/panel/index.js';

/** Arguments of the commands that open a host's page; the window's host by default. */
export interface HostArgs {
  host?: string;
}

/** The host a page opens on when none is named: the window's, or with every host the first the filter shows. */
const pageHost = (store: ReactiveStore): string | undefined => (embedMode() === 'multi' ? shownHosts(store)[0] : windowHost());

/** The display size class the modus backend publishes. */
const MODUS_CLASS = '$/modus/class' as BindingPath;

/** Where a strip button's click leaves its strip's surface and active tab. */
const SURFACE_NAME = '$/surface/name' as BindingPath;
const TAB_KEY = '$/tab/key' as BindingPath;

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
      component: 'HostSettingsWindow',
      category: 'page',
      renderer: { kind: 'react', load: () => import('./SettingsWindow.js') },
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
    // A settings tab's *Open in*: the places, in the palette, from the tab's strip.
    scena.commands.register({
      id: 'ahp.settings.openIn',
      title: () => translate('host/settings/openIn'),
      icon: EMOJIcon.layoutGroups,
      slots: [STRIP_SLOT],
      when: (ctx) => ctx['$/tab/component'] === 'HostSettingsPage',
      run: (ctx) => {
        const host = settingsHostOf(ctx.store.get(TAB_KEY));
        if (host === undefined) return;
        const surface = ctx.store.get<string>(SURFACE_NAME);
        const current: SettingsPlace = surface === 'sidebar:right' || surface === 'panel:bottom' ? surface : 'main';
        openPalette(ctx.scena, { items: placeItems(ctx.scena, host, current) });
      },
    }),
    // A settings tab's menu offers the other places, as a file tab's offers its other viewers.
    scena.mountMenus.register('tab:context', (mount) => {
      const node = mount.component as { component?: unknown; host?: unknown; place?: unknown };
      if (node.component !== 'HostSettingsPage' || typeof node.host !== 'string') return [];
      const current = PLACES.find((place) => place === node.place) ?? 'main';
      return placeItems(scena, node.host, current, true);
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
        openSettingsAt(ctx.scena, host, settingsPlace());
        hideOverlaidSidebar(ctx.scena, ctx.store.get<ModusClass>(MODUS_CLASS) ?? 'large');
      },
    }),
    // The settings on their Interface tab; the settings open again wherever they are, so the tab shows.
    scena.commands.register({
      id: 'ahp.openInterfaceSettings',
      title: () => translate('host/commands/interface'),
      keywords: [english('host/commands/interface'), 'ui', 'theme', 'language'],
      category: 'Interface',
      slots: [PALETTE_SLOT],
      run: (ctx, args) => {
        const host = (args as HostArgs | undefined)?.host ?? pageHost(ctx.store);
        if (host === undefined) return;
        keepSettingsTab('ui');
        openSettingsAt(ctx.scena, host, settingsPlace());
        hideOverlaidSidebar(ctx.scena, ctx.store.get<ModusClass>(MODUS_CLASS) ?? 'large');
      },
    }),
  );
}
