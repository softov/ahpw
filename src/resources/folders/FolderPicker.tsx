import { useEffect, useRef, useState, type KeyboardEvent, type ReactElement } from 'react';
import { useI18n, useStore } from '@softov/scena/react';
import { kindOfResource } from '../../bridges/data.js';
import { folderUri } from '../../bridges/words.js';
import { childFolders, expandHome, parentPath, splitPath } from './folder-path.js';
import { FOLDER_REQUEST, settleFolder, type FolderRequest } from './pick.js';

/** The open folder question, at the top of the page as VS Code's "Add Folder to Workspace". */
export function FolderPicker(): ReactElement | null {
  const request = useStore<FolderRequest | null>(FOLDER_REQUEST);
  if (request === undefined || request === null) return null;
  return <PickerCard key={request.id} request={request} />;
}

/** What a folder's listing is: still coming, its folders, or a path the host has no folder at. */
type Listing = { state: 'loading' } | { state: 'ok'; folders: string[] } | { state: 'missing' };

const UP = '..';

/**
 * A path box over the folders of the folder it names. Typing filters by the
 * last part; Enter or Tab on a line goes into that folder, `..` goes up, and
 * Enter with no line picked, or Add, answers the path once the host says it
 * is a folder.
 */
function PickerCard({ request }: { request: FolderRequest }): ReactElement {
  const { t } = useI18n();
  const [value, setValue] = useState(request.start);
  const [listings, setListings] = useState<ReadonlyMap<string, Listing>>(new Map());
  const [picked, setPicked] = useState(-1);
  const [problem, setProblem] = useState<string | null>(null);
  const box = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);

  const { dir, part } = splitPath(value);
  const listing = dir === '' ? undefined : listings.get(dir);

  // Each folder is asked for once while the picker is open.
  useEffect(() => {
    if (dir === '' || listings.has(dir)) return;
    setListings((held) => new Map(held).set(dir, { state: 'loading' }));
    childFolders(dir)
      .then((folders) => setListings((held) => new Map(held).set(dir, { state: 'ok', folders })))
      .catch(() => setListings((held) => new Map(held).set(dir, { state: 'missing' })));
  }, [dir, listings]);

  useEffect(() => {
    box.current?.focus();
    const end = request.start.length;
    box.current?.setSelectionRange(end, end);
  }, [request.start]);

  const lower = part.toLowerCase();
  const names = listing?.state === 'ok' ? listing.folders.filter((name) => name.toLowerCase().startsWith(lower)) : [];
  const lines = parentPath(dir) === null || part !== '' ? names : [UP, ...names];

  useEffect(() => {
    list.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [picked]);

  const type = (next: string): void => {
    setValue(expandHome(next, request.home));
    setPicked(-1);
    setProblem(null);
  };

  const enter = (line: string): void => {
    type(line === UP ? (parentPath(dir) ?? dir) : `${dir}${line}/`);
    box.current?.focus();
  };

  const add = async (): Promise<void> => {
    const path = value.trim();
    if (path === '') return;
    const kind = await kindOfResource(folderUri(path)).catch(() => null);
    if (kind === 'directory') settleFolder(path);
    else setProblem(kind === null ? t('folders/pick/missing') : t('folders/pick/notFolder'));
  };

  const onKey = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      settleFolder(null);
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (lines.length === 0) return;
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setPicked((at) => (at + step + lines.length) % lines.length);
    } else if (event.key === 'Tab') {
      const line = lines[picked] ?? names[0];
      if (line === undefined) return;
      event.preventDefault();
      enter(line);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const line = lines[picked];
      if (line === undefined) void add();
      else enter(line);
    }
  };

  const message = problem
    ?? (listing?.state === 'missing' ? t('folders/pick/missingHint') : null);

  return (
    <div className="web-pick" onClick={() => settleFolder(null)}>
      <div className="web-pick__card" role="dialog" aria-modal="true" aria-labelledby="web-pick-title" onClick={(event) => event.stopPropagation()}>
        <h2 id="web-pick-title" className="web-pick__title">{request.title}</h2>
        <div className="web-pick__row">
          <input
            ref={box}
            className="web-pick__input"
            value={value}
            spellCheck={false}
            aria-label={t('folders/pick/path')}
            aria-controls="web-pick-list"
            aria-activedescendant={picked >= 0 ? `web-pick-${picked}` : undefined}
            onChange={(event) => type(event.currentTarget.value)}
            onKeyDown={onKey}
          />
          <button type="button" className="web-pick__add" onClick={() => void add()}>{t('folders/pick/add')}</button>
        </div>
        {message === null ? null : <p className="web-pick__message">{message}</p>}
        <ul ref={list} id="web-pick-list" className="web-pick__list" role="listbox" aria-label={t('folders/pick/folders')}>
          {lines.map((line, index) => (
            <li
              key={line}
              id={`web-pick-${index}`}
              role="option"
              aria-selected={index === picked}
              className="web-pick__item"
              onMouseEnter={() => setPicked(index)}
              onClick={() => enter(line)}
            >
              {line}
            </li>
          ))}
          {listing?.state === 'loading' ? <li className="web-pick__note">{t('folders/pick/reading')}</li> : null}
          {listing?.state === 'ok' && names.length === 0 && part !== '' ? <li className="web-pick__note">{t('folders/pick/noMatch', { part })}</li> : null}
        </ul>
      </div>
    </div>
  );
}
