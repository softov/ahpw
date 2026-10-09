import { useEffect, useState, type ReactElement } from 'react';
import { readText } from '../connection/data.js';
import { folderLabel } from '../connection/words.js';

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
      .catch((error: unknown) => { if (alive) setState({ error: error instanceof Error ? error.message : String(error) }); });
    return () => { alive = false; };
  }, [uri]);
  return state;
}

/** The bar above a file: its path and a button that copies it. */
export function FileHead({ uri }: { uri: string }): ReactElement {
  const path = folderLabel(uri);
  return (
    <div className="web-file__head">
      <code>{path}</code>
      <button type="button" className="web-tool__copy" onClick={() => void navigator.clipboard?.writeText(path).catch(() => undefined)}>Copy path</button>
    </div>
  );
}
