import { useEffect, useState, type ReactElement, type ReactNode } from 'react';
import { useI18n } from '@softov/scena/react';
import { Alert, Spinner } from '@softov/scena/ui';
import { readBlob, sizeOf } from '../../bridges/data.js';
import { readFailure } from './save.js';
import { mediaTypeOf } from './icons.js';
import { FileHead } from './text.js';
import { PageAlert } from '../../shell/view/PageAlert.js';

/** Past this size a file is not read, because it arrives whole over the connection. */
export const MAX_BYTES = 64 * 1024 * 1024;

/** A file as a URL the page can draw: null while it reads. */
export type FileUrl = { url: string } | { error: string } | { size: number } | null;

const megabytes = (bytes: number): string => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

/** Reads a file through the host into a blob URL, revoked when `uri` changes or the page closes. */
export function useFileUrl(uri: string | undefined): FileUrl {
  const [state, setState] = useState<FileUrl>(null);
  useEffect(() => {
    if (uri === undefined) return;
    let alive = true;
    let url: string | undefined;
    setState(null);
    (async () => {
      const size = await sizeOf(uri);
      if (size !== undefined && size > MAX_BYTES) return { size };
      url = URL.createObjectURL(await readBlob(uri, mediaTypeOf(uri)));
      return { url };
    })()
      .then((next) => { if (alive) setState(next); })
      .catch((error: unknown) => { if (alive) setState({ error: readFailure(error) }); });
    return () => {
      alive = false;
      if (url !== undefined) URL.revokeObjectURL(url);
    };
  }, [uri]);
  return state;
}

/** A media file's page: its head, then what `children` draws once the file is read, or why it is not. */
export function MediaFrame({ uri, children }: { uri: string | undefined; children: (url: string) => ReactNode }): ReactElement {
  const { t } = useI18n();
  const state = useFileUrl(uri);
  if (uri === undefined) return <PageAlert tone="warning" message={t('files/noFile')} />;
  const head = <FileHead uri={uri} />;
  if (state === null) return <div className="web-file">{head}<Spinner label={t('files/reading')} /></div>;
  if ('error' in state) return <div className="web-file">{head}<Alert tone="danger" title={t('files/notReadable')} message={state.error} /></div>;
  if ('size' in state) {
    return <div className="web-file">{head}<p className="web-note web-media__note">{t('files/tooLarge', { size: megabytes(state.size), max: megabytes(MAX_BYTES) })}</p></div>;
  }
  return <div className="web-file">{head}<div className="web-file__body web-media">{children(state.url)}</div></div>;
}
