import { useEffect, useState, type ReactElement } from 'react';
import { useI18n } from '@softov/scena/react';
import { readText } from '../../bridges/data.js';
import { readFailure } from './save.js';
import { folderLabel } from '../../bridges/words.js';
import { CopyButton } from '../../shell/controls/CopyButton.js';

/** A file's text: null while it reads, `text: null` when the file is not text. */
export type FileText = { text: string | null } | { error: string } | null;

/** Reads a file through the host, again whenever `uri` changes. */
export function useFileText(uri: string | undefined): FileText {
  const [state, setState] = useState<FileText>(null);
  useEffect(() => {
    if (uri === undefined) return;
    let alive = true;
    setState(null);
    readText(uri)
      .then((read) => { if (alive) setState({ text: read.text }); })
      .catch((error: unknown) => { if (alive) setState({ error: readFailure(error) }); });
    return () => { alive = false; };
  }, [uri]);
  return state;
}

/** The bar above a file: its path, whether it has changes not saved, and a button that copies the path. */
export function FileHead({ uri, dirty = false }: { uri: string; dirty?: boolean }): ReactElement {
  const { t } = useI18n();
  const path = folderLabel(uri);
  return (
    <div className="web-file__head">
      <code>{path}</code>
      {dirty ? <span className="web-file__dirty" title={t('files/notSaved')}>{t('files/edited')}</span> : null}
      <CopyButton text={path} label={t('files/copyPath')} />
    </div>
  );
}
