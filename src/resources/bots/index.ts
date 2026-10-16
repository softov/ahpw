import type { BindingPath, Disposable, Scena } from '@softov/scena/types';
import { combineDisposables, translate, type ModusClass } from '@softov/scena';
import { PALETTE_SLOT } from '../../shell/CommandPalette.js';
import { hideOverlaidSidebar } from '../sessions/index.js';
import { ahpPaths, channelPath, hostBridge } from '../../bridges/data.js';
import { HOST_FILTER_ACTION, shownHosts } from '../../bridges/hosts.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import { trackServed } from '../../bridges/served.js';
import { confirm, failed } from '../../shell/notify/index.js';
import { readLastHost, startHost } from '../sessions/last-host.js';
import { EMOJIcon } from '../emojis.js';
import { bound, english } from '../../i18n/locales.js';
import { BOTS, BOTS_SCHEME, deleteBot, type BotsState } from './catalogue.js';
import { ACTIVE_BOT, BOTS_SERVED } from './state.js';

/** The display size class the modus backend publishes. */
const MODUS_CLASS = '$/modus/class' as BindingPath;

/** The sidebar section the bots list shows in. */
export const BOTS_SECTION = 'ahp:bots';

/** Arguments of the commands about one bot. */
interface BotArgs {
  host: string;
  slug: string;
  /** Its name, for a bot the catalogue has not brought yet. */
  name?: string;
}

const serving = (offers: Offers | undefined): boolean => offers?.channels.includes(BOTS_SCHEME) ?? false;

/** The bots list, a bot's page, and the form that makes or edits one. */
export function registerBots(scena: Scena): Disposable {
  const botOf = (args: BotArgs) => scena.store.get<BotsState>(channelPath(args.host, BOTS))?.bots.find((one) => one.id === args.slug);
  type Opened = Parameters<Scena['surfaces']['open']>[0];
  const open = (key: string, resource: Opened['resource'], title: NonNullable<NonNullable<Opened['props']>['title']>): void => {
    scena.surfaces.open({ surface: 'main', key, resource, props: { title } });
    hideOverlaidSidebar(scena, scena.store.get<ModusClass>(MODUS_CLASS) ?? 'large');
  };
  return combineDisposables(
    trackServed(scena, BOTS_SCHEME, BOTS_SERVED),
    scena.components.register({
      component: 'BotExplorer',
      category: 'page',
      renderer: { kind: 'react', load: () => import('./Explorer.js') },
      props: {
        title: { t: 'bots/explorer/title' },
        actions: [
          { command: 'ahp.newBot', icon: '+', label: { t: 'bots/commands/new' } },
          { command: 'bots.reload', icon: EMOJIcon.reload, label: { t: 'common/reload' } },
          HOST_FILTER_ACTION,
        ],
      },
    }),
    scena.components.register({ component: 'BotPage', category: 'page', props: { icon: EMOJIcon.bots }, renderer: { kind: 'react', load: () => import('./Page.js') } }),
    scena.components.register({ component: 'BotLayer', category: 'chrome', renderer: { kind: 'react', load: () => import('./layer/BotLayer.js') } }),
    // The floating bots, while a host serves them.
    scena.surfaces.mount({ surface: 'overlay', key: 'bots:layer', when: `${BOTS_SERVED} == true`, resource: { component: 'BotLayer' } }),
    scena.components.register({ component: 'BotEditPage', category: 'page', props: { icon: EMOJIcon.bots }, renderer: { kind: 'react', load: () => import('./Edit.js') } }),
    scena.commands.register({
      id: 'bots.reload',
      title: () => translate('common/reload'),
      run: (ctx) => Promise.all(shownHosts(ctx.store)
        .filter((host) => serving(ctx.store.get<Offers>(ahpPaths(host).offers)))
        .map((host) => hostBridge(host).refresh(BOTS))),
    }),
    scena.commands.register({
      id: 'ahp.showBots',
      title: () => translate('bots/commands/show'),
      keywords: [english('bots/commands/show')],
      category: 'Bots',
      slots: [PALETTE_SLOT],
      when: () => scena.store.get<boolean>(BOTS_SERVED) === true,
      run: (ctx) => ctx.commands.execute('sidebar.activate', { section: BOTS_SECTION }),
    }),
    scena.commands.register({
      id: 'ahp.newBot',
      title: () => translate('bots/commands/new'),
      keywords: [english('bots/commands/new')],
      category: 'Bots',
      slots: [PALETTE_SLOT],
      when: () => scena.store.get<boolean>(BOTS_SERVED) === true,
      run: (ctx, args) => {
        const given = (args as { host?: string } | undefined)?.host;
        const hosts = shownHosts(ctx.store).filter((host) => serving(ctx.store.get<Offers>(ahpPaths(host).offers)));
        const host = given ?? startHost(hosts, readLastHost());
        if (host !== undefined) open('bot:new', { component: 'BotEditPage', host }, bound('bots/commands/new'));
      },
    }),
    scena.commands.register({
      id: 'ahp.openBot',
      title: () => translate('bots/commands/open'),
      run: (ctx, args) => {
        const target = args as BotArgs | undefined;
        if (target?.slug === undefined) return;
        ctx.store.set(ACTIVE_BOT, { host: target.host, slug: target.slug });
        open(`bot:${target.host}:${target.slug}`, { component: 'BotPage', host: target.host, slug: target.slug }, botOf(target)?.name ?? target.name ?? target.slug);
      },
    }),
    scena.commands.register({
      id: 'ahp.editBot',
      title: () => translate('bots/commands/edit'),
      run: (_ctx, args) => {
        const target = args as BotArgs | undefined;
        if (target?.slug === undefined) return;
        const name = botOf(target)?.name ?? target.slug;
        open(`bot:edit:${target.host}:${target.slug}`, { component: 'BotEditPage', host: target.host, slug: target.slug }, translate('bots/editTitle', { name }));
      },
    }),
    scena.commands.register({
      id: 'ahp.chatWithBot',
      title: () => translate('bots/actions/chat'),
      run: (ctx, args) => {
        const target = args as BotArgs | undefined;
        const session = target === undefined ? undefined : botOf(target)?.session;
        if (session !== undefined) void ctx.commands.execute('ahp.openSession', { host: target!.host, resource: session });
      },
    }),
    scena.commands.register({
      id: 'ahp.deleteBot',
      title: () => translate('bots/actions/delete'),
      run: async (_ctx, args) => {
        const target = args as BotArgs | undefined;
        if (target?.slug === undefined) return;
        const name = botOf(target)?.name ?? target.slug;
        if (!(await confirm({ title: translate('bots/actions/deleteTitle', { name }), body: translate('bots/actions/deleteBody'), confirmLabel: translate('bots/actions/delete'), tone: 'danger' }))) return;
        const offers = scena.store.get<Offers>(ahpPaths(target.host).offers) ?? NO_OFFERS;
        await deleteBot(target.host, offers, target.slug).then(
          () => scena.surfaces.close(`bot:${target.host}:${target.slug}`),
          (error: unknown) => failed(translate('bots/actions/failed'), error),
        );
      },
    }),
    scena.surfaces.mount({
      surface: 'sidebar:left',
      key: 'bots:explorer',
      when: `$/layout/surfaces/sidebar:left/section == "${BOTS_SECTION}"`,
      resource: { component: 'BotExplorer' },
    }),
  );
}
