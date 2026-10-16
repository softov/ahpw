import type { BindingPath, Disposable, Scena } from '@softov/scena/types';
import { combineDisposables, translate } from '@softov/scena';
import { english } from '../../i18n/locales.js';
import { PALETTE_SLOT } from '../../shell/CommandPalette.js';
import { EMOJIcon } from '../emojis.js';
import { registerEntryCommands } from './actions.js';
import { ADDED_FOLDERS, readAdded } from './added.js';
import { EXPANDED_FOLDERS, readExpanded } from './expanded.js';
import { initAsk, resetAsk } from './ask.js';
import { FolderPicker } from './FolderPicker.js';
import { NameDialog } from './NameDialog.js';
import { initPick, resetPick } from './pick.js';

/** The sidebar section the folder tree shows in. */
export const FOLDERS_SECTION = 'ahp:folders';

/** Bumped to have the tree read every open folder again; the header's Refresh does it. */
export const RELOAD_FOLDERS = '$/ahp/folders/reload' as BindingPath;

/** A folder the explorer is asked to show, until it does. */
export const REVEAL_FOLDER = '$/ahp/folders/reveal' as BindingPath;

/** Arguments of `ahp.revealFolder`. */
export interface RevealFolderArgs {
  uri: string;
}

/** The host's folders, as a tree in the sidebar, with the menus on its rows and the dialog they ask names in. */
export function registerFolders(scena: Scena): Disposable {
  initAsk(scena.store);
  initPick(scena.store);
  scena.store.set(ADDED_FOLDERS, readAdded());
  scena.store.set(EXPANDED_FOLDERS, readExpanded());
  return combineDisposables(
    { dispose: resetAsk },
    { dispose: resetPick },
    scena.components.register({
      component: 'FolderExplorer',
      category: 'page',
      renderer: { kind: 'react', load: () => import('./Explorer.js') },
      // scena draws the section's header from these.
      props: {
        title: { t: 'folders/explorer/title' },
        actions: [{ command: 'folders.reload', icon: EMOJIcon.reload, label: { t: 'folders/explorer/refresh' } }],
      },
    }),
    scena.commands.register({
      id: 'folders.reload',
      title: () => translate('folders/explorer/refresh'),
      run: (ctx) => ctx.store.set(RELOAD_FOLDERS, (ctx.store.get<number>(RELOAD_FOLDERS) ?? 0) + 1),
    }),
    scena.commands.register({
      id: 'ahp.showFolders',
      title: () => translate('folders/commands/show'),
      keywords: [english('folders/commands/show')],
      category: 'Files',
      slots: [PALETTE_SLOT],
      run: (ctx) => ctx.commands.execute('sidebar.activate', { section: FOLDERS_SECTION }),
    }),
    scena.commands.register({
      id: 'ahp.revealFolder',
      title: () => translate('folders/commands/reveal'),
      run: (ctx, args) => {
        const uri = (args as RevealFolderArgs | undefined)?.uri;
        if (uri === undefined) return;
        ctx.store.set(REVEAL_FOLDER, uri);
        return ctx.commands.execute('sidebar.activate', { section: FOLDERS_SECTION });
      },
    }),
    scena.components.register({
      component: 'Folders.Name',
      category: 'chrome',
      renderer: { kind: 'react', load: async () => ({ default: NameDialog as unknown }) },
    }),
    scena.surfaces.mount({ surface: 'overlay', key: 'folders:name', resource: { component: 'Folders.Name' } }),
    scena.components.register({
      component: 'Folders.Pick',
      category: 'chrome',
      renderer: { kind: 'react', load: async () => ({ default: FolderPicker as unknown }) },
    }),
    scena.surfaces.mount({ surface: 'overlay', key: 'folders:pick', resource: { component: 'Folders.Pick' } }),
    registerEntryCommands(scena),
    scena.surfaces.mount({
      surface: 'sidebar:left',
      key: 'folders:explorer',
      when: `$/layout/surfaces/sidebar:left/section == "${FOLDERS_SECTION}"`,
      resource: { component: 'FolderExplorer' },
    }),
  );
}
