import type { BindingPath, Disposable, Scena } from '@softov/scena/types';
import { combineDisposables, translate, type ModusClass } from '@softov/scena';
import { PALETTE_SLOT } from '../../shell/CommandPalette.js';
import { hideOverlaidSidebar } from '../sessions/index.js';
import { ahpPaths } from '../../bridges/data.js';
import { everyHost } from '../../bridges/hosts.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import { selfId } from '../../bridges/people.js';
import { EMOJIcon } from '../emojis.js';
import { bound, english } from '../../i18n/locales.js';
import { profileTab } from './state.js';

/** The display size class the modus backend publishes. */
const MODUS_CLASS = '$/modus/class' as BindingPath;

/** The profile command's arguments: whose host. */
export interface ProfileArgs {
  host?: string;
}

/** The signed-in person's own page, one per host they are a person on. */
export function registerProfilePage(scena: Scena): Disposable {
  const offersOf = (host: string): Offers => scena.store.get<Offers>(ahpPaths(host).offers) ?? NO_OFFERS;
  const signedIn = (): string[] => everyHost(scena.store).filter((host) => selfId(offersOf(host)) !== undefined);

  return combineDisposables(
    scena.components.register({ component: 'ProfilePage', category: 'page', props: { icon: EMOJIcon.users }, renderer: { kind: 'react', load: () => import('./ProfilePage.js') } }),
    scena.commands.register({
      id: 'ahp.openProfile',
      title: () => translate('profile/commands/open'),
      keywords: [english('profile/commands/open')],
      category: 'Users',
      slots: [PALETTE_SLOT],
      when: () => signedIn().length > 0,
      // From the palette, with no host named, the first host they are signed in to.
      run: (_ctx, args) => {
        const host = (args as ProfileArgs | undefined)?.host ?? signedIn()[0];
        if (host === undefined) return;
        scena.surfaces.open({ surface: 'main', key: profileTab(host), resource: { component: 'ProfilePage', host }, props: { title: bound('profile/title') } });
        hideOverlaidSidebar(scena, scena.store.get<ModusClass>(MODUS_CLASS) ?? 'large');
      },
    }),
  );
}
