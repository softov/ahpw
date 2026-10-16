import type { BindingPath, Disposable, Scena } from '@softov/scena/types';
import { combineDisposables, translate } from '@softov/scena';
import { AHP_DEFAULT_DIRECTORY, copyResource, deleteResource, makeFolder, moveResource, readBase64, writeResource } from '../../bridges/data.js';
import { folderLabel } from '../../bridges/words.js';
import { plural } from '../../i18n/locales.js';
import { confirm, done, failed } from '../../shell/notify/index.js';
import { ADDED_FOLDERS, withFolder, withoutFolder, writeAdded } from './added.js';
import { askName } from './ask.js';
import { askFolder } from './pick.js';
import {
  ENTRY_ACTIONS, ENTRY_ICONS, ENTRY_SLOT, MENU_ENTRY,
  base64Of, bytesOf, copyNameOf, entryActions, folderUriOf, leafOf, nameProblem, parentOf, siblingUri,
  type EntryAction, type MenuEntry,
} from './menu.js';
import { childUri } from './roots.js';

/** Folders whose listings changed, as `StaleFolders`; the explorer reads those it shows again. */
export const STALE_FOLDERS = '$/folders/stale' as BindingPath;

/** Folders to read again, and when they were named, so naming one twice is two changes. */
export interface StaleFolders {
  uris: string[];
  at: number;
}

/** Ask the explorer to read these folders again. */
export function markStale(scena: Scena, ...uris: string[]): void {
  scena.store.set(STALE_FOLDERS, { uris, at: Date.now() } satisfies StaleFolders);
}

/** Walk to a folder on the host, starting at its default folder, and add it as a root. Answers its URI, or null. */
export async function addFolder(scena: Scena): Promise<string | null> {
  const home = scena.store.get<string | null>(AHP_DEFAULT_DIRECTORY) ?? null;
  const homePath = home === null ? null : folderLabel(home).replace(/\/+$/, '');
  const path = await askFolder({ title: translate('folders/addFolder'), start: homePath === null ? '/' : `${homePath}/`, home: homePath });
  const uri = path === null ? null : folderUriOf(path);
  if (uri === null) return null;
  const added = withFolder(scena.store.get<string[]>(ADDED_FOLDERS) ?? [], uri);
  scena.store.set(ADDED_FOLDERS, added);
  writeAdded(added);
  return uri;
}

/** Let a person pick files on this computer. */
function pickFiles(onPick: (files: File[]) => void): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = true;
  input.onchange = () => onPick(Array.from(input.files ?? []));
  input.oncancel = () => onPick([]);
  input.click();
}

/** Save bytes from the host as a file on this computer. */
function save(name: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

/** Ask for a name that can be used. */
const askFor = (title: string, confirmLabel: string, value = ''): Promise<string | null> =>
  askName({ title, value, confirmLabel, check: nameProblem });

/** What each action does to the row its menu is open on. */
const RUN: Record<EntryAction, (scena: Scena, entry: MenuEntry) => Promise<void>> = {
  newFile: async (scena, { uri }) => {
    const name = await askFor(translate('folders/entry/newFile'), translate('folders/ask/create'));
    if (name === null) return;
    await writeResource(childUri(uri, name), '', 'utf-8', true);
    markStale(scena, uri);
  },
  newFolder: async (scena, { uri }) => {
    const name = await askFor(translate('folders/entry/newFolder'), translate('folders/ask/create'));
    if (name === null) return;
    await makeFolder(childUri(uri, name));
    markStale(scena, uri);
  },
  upload: async (scena, { uri }) => {
    const files = await new Promise<File[]>((resolve) => pickFiles(resolve));
    if (files.length === 0) return;
    try {
      for (const file of files) await writeResource(childUri(uri, file.name), base64Of(new Uint8Array(await file.arrayBuffer())), 'base64', true);
    } finally {
      markStale(scena, uri);
    }
    const [only] = files;
    done(files.length === 1 && only !== undefined ? translate('folders/uploaded', { name: only.name }) : plural('folders/uploadedFiles', files.length));
  },
  copyPath: async (_scena, { uri }) => {
    await navigator.clipboard.writeText(folderLabel(uri));
    done(translate('folders/pathCopied'));
  },
  download: async (_scena, { uri }) => {
    const read = await readBase64(uri);
    const type = read.contentType ?? 'application/octet-stream';
    save(leafOf(uri), read.encoding === 'base64' ? new Blob([bytesOf(read.data)], { type }) : new Blob([read.data], { type }));
  },
  rename: async (scena, { uri }) => {
    const name = await askFor(translate('folders/entry/rename'), translate('folders/entry/rename'), leafOf(uri));
    if (name === null || name === leafOf(uri)) return;
    await moveResource(uri, siblingUri(uri, name));
    markStale(scena, parentOf(uri));
  },
  copy: async (scena, { uri }) => {
    const name = await askFor(translate('folders/entry/copy'), translate('folders/entry/copy'), copyNameOf(leafOf(uri)));
    if (name === null) return;
    await copyResource(uri, siblingUri(uri, name));
    markStale(scena, parentOf(uri));
  },
  removeFolder: async (scena, { uri }) => {
    const added = withoutFolder(scena.store.get<string[]>(ADDED_FOLDERS) ?? [], uri);
    scena.store.set(ADDED_FOLDERS, added);
    writeAdded(added);
  },
  delete: async (scena, { uri, directory }) => {
    const asked = await confirm({
      title: translate('folders/delete/title', { name: leafOf(uri) }),
      ...(directory ? { body: translate('folders/delete/body') } : {}),
      confirmLabel: translate('folders/entry/delete'),
      tone: 'danger',
    });
    if (!asked) return;
    await deleteResource(uri, directory);
    markStale(scena, parentOf(uri));
  },
};


/** A file or folder row's commands, each shown on the rows it applies to. */
export function registerEntryCommands(scena: Scena): Disposable {
  return combineDisposables(...ENTRY_ACTIONS.map((action) => scena.commands.register({
    id: `folders.${action}`,
    title: () => translate(`folders/entry/${action}`),
    icon: ENTRY_ICONS[action],
    ...(action === 'delete' ? { color: 'red' as const } : {}),
    slots: [ENTRY_SLOT],
    when: () => entryActions(scena.store.get<MenuEntry | null>(MENU_ENTRY)).includes(action),
    run: async (ctx) => {
      ctx.host?.closeMenu();
      const entry = scena.store.get<MenuEntry | null>(MENU_ENTRY);
      if (entry === null || entry === undefined) return;
      try {
        await RUN[action](scena, entry);
      } catch (error) {
        failed(translate(`folders/failed/${action}`), error, { source: `folders.${action}` });
      }
    },
  })));
}
