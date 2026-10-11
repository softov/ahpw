import type { BindingPath, Disposable, Scena } from '@softov/scena/types';
import { combineDisposables } from '@softov/scena';
import { copyResource, deleteResource, kindOfResource, makeFolder, moveResource, readBase64, writeResource } from '../connection/data.js';
import { folderLabel } from '../connection/words.js';
import { confirm, done, failed } from '../notify/index.js';
import { ADDED_FOLDERS, withFolder, withoutFolder, writeAdded } from './added.js';
import { askName } from './ask.js';
import {
  ENTRY_ACTIONS, ENTRY_SLOT, ENTRY_WORDS, MENU_ENTRY,
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

/** Ask for a folder path, and add it as a root once the host says it is a folder. Answers its URI, or null. */
export async function addFolder(scena: Scena): Promise<string | null> {
  const path = await askName({
    title: 'Add folder',
    label: 'Path',
    confirmLabel: 'Add',
    check: (value) => (folderUriOf(value) === null ? 'Give a full path, such as /home/me/src.' : null),
  });
  const uri = path === null ? null : folderUriOf(path);
  if (uri === null) return null;
  if ((await kindOfResource(uri)) !== 'directory') {
    failed('The folder could not be added', new Error(`${folderLabel(uri)} is not a folder on the server.`), { source: 'folders.add' });
    return null;
  }
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
    const name = await askFor('New file', 'Create');
    if (name === null) return;
    await writeResource(childUri(uri, name), '', 'utf-8', true);
    markStale(scena, uri);
  },
  newFolder: async (scena, { uri }) => {
    const name = await askFor('New folder', 'Create');
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
    done(files.length === 1 ? `${files[0]?.name ?? 'File'} uploaded` : `${files.length} files uploaded`);
  },
  copyPath: async (_scena, { uri }) => {
    await navigator.clipboard.writeText(folderLabel(uri));
    done('Path copied');
  },
  download: async (_scena, { uri }) => {
    const read = await readBase64(uri);
    const type = read.contentType ?? 'application/octet-stream';
    save(leafOf(uri), read.encoding === 'base64' ? new Blob([bytesOf(read.data)], { type }) : new Blob([read.data], { type }));
  },
  rename: async (scena, { uri }) => {
    const name = await askFor('Rename', 'Rename', leafOf(uri));
    if (name === null || name === leafOf(uri)) return;
    await moveResource(uri, siblingUri(uri, name));
    markStale(scena, parentOf(uri));
  },
  copy: async (scena, { uri }) => {
    const name = await askFor('Copy', 'Copy', copyNameOf(leafOf(uri)));
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
      title: `Delete "${leafOf(uri)}"?`,
      ...(directory ? { body: 'Everything in it goes with it.' } : {}),
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (!asked) return;
    await deleteResource(uri, directory);
    markStale(scena, parentOf(uri));
  },
};

/** What a failed action says. */
const FAILED: Record<EntryAction, string> = {
  newFile: 'The file could not be created',
  newFolder: 'The folder could not be created',
  upload: 'The upload failed',
  copyPath: 'The path could not be copied',
  download: 'The download failed',
  rename: 'The rename failed',
  copy: 'The copy failed',
  removeFolder: 'The folder could not be removed',
  delete: 'The delete failed',
};

/** A file or folder row's commands, each shown on the rows it applies to. */
export function registerEntryCommands(scena: Scena): Disposable {
  return combineDisposables(...ENTRY_ACTIONS.map((action) => scena.commands.register({
    id: `folders.${action}`,
    title: ENTRY_WORDS[action].title,
    icon: ENTRY_WORDS[action].icon,
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
        failed(FAILED[action], error, { source: `folders.${action}` });
      }
    },
  })));
}
