import type { BindingPath, Disposable, Scena } from '@softov/scena/types';
import { combineDisposables } from '@softov/scena';
import { PALETTE_SLOT } from '../../shell/CommandPalette.js';
import { registerEntryCommands } from './actions.js';
import { ADDED_FOLDERS, readAdded } from './added.js';
import { EXPANDED_FOLDERS, readExpanded } from './expanded.js';
import { initAsk, resetAsk } from './ask.js';
import { FolderPicker } from './FolderPicker.js';
import { NameDialog } from './NameDialog.js';
import { initPick, resetPick } from './pick.js';

/** The sidebar section the folder tree shows in. */
export const FOLDERS_SECTION = 'ahp:folders';

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
    }),
    scena.commands.register({
      id: 'ahp.showFolders',
      title: 'Show the explorer',
      category: 'Files',
      slots: [PALETTE_SLOT],
      run: (ctx) => ctx.commands.execute('sidebar.activate', { section: FOLDERS_SECTION }),
    }),
    scena.commands.register({
      id: 'ahp.revealFolder',
      title: 'Show the folder in the explorer',
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
