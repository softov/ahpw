import type { BindingPath, Disposable, Scena } from '@softov/scena/types';
import { combineDisposables } from '@softov/scena';
import { PALETTE_SLOT } from '../view/Palette.js';

/** The sidebar section the folder tree shows in. */
export const FOLDERS_SECTION = 'ahp:folders';

/** A folder the explorer is asked to show, until it does. */
export const REVEAL_FOLDER = '$/ahp/folders/reveal' as BindingPath;

/** Arguments of `ahp.revealFolder`. */
export interface RevealFolderArgs {
  uri: string;
}

/** The host's folders, as a tree in the sidebar. */
export function registerFolders(scena: Scena): Disposable {
  return combineDisposables(
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
    scena.surfaces.mount({
      surface: 'sidebar:left',
      key: 'folders:explorer',
      when: `$/layout/surfaces/sidebar:left/section == "${FOLDERS_SECTION}"`,
      resource: { component: 'FolderExplorer' },
    }),
  );
}
