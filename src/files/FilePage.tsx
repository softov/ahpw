import { useEffect, useRef, useState, type ReactElement } from 'react';
import { Alert, Spinner } from '@softov/scena/ui';
import { readText } from '../connection/data.js';
import { folderLabel } from '../connection/words.js';
import { splitLines } from './diff.js';

/** Past this many lines a file is cut, so a log does not freeze the page. */
const MAX_LINES = 5000;

/** A file the daemon can read, with line numbers, scrolled to the lines a link named. */
export default function FilePage({ uri, line, end }: { uri?: string; line?: number | null; end?: number | null }): ReactElement {
  const [state, setState] = useState<{ text: string | null } | { error: string } | null>(null);
  const marked = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    if (uri === undefined) return;
    let alive = true;
    setState(null);
    readText(uri)
      .then((read) => { if (alive) setState({ text: read.text }); })
      .catch((error: unknown) => { if (alive) setState({ error: error instanceof Error ? error.message : String(error) }); });
    return () => { alive = false; };
  }, [uri]);

  useEffect(() => {
    marked.current?.scrollIntoView({ block: 'center' });
  }, [state, line]);

  if (uri === undefined) return <Alert tone="warning" message="No file was named." />;
  const path = folderLabel(uri);
  const head = (
    <div className="web-file__head">
      <code>{path}</code>
      <button type="button" className="web-tool__copy" onClick={() => void navigator.clipboard?.writeText(path).catch(() => undefined)}>Copy path</button>
    </div>
  );
  if (state === null) return <div className="web-file">{head}<Spinner label="Reading the file" /></div>;
  if ('error' in state) return <div className="web-file">{head}<Alert tone="danger" title="Not readable" message={state.error} /></div>;
  if (state.text === null) return <div className="web-file">{head}<p className="web-note">This file is not text.</p></div>;

  const lines = splitLines(state.text);
  const shown = lines.slice(0, MAX_LINES);
  const from = line ?? -1;
  const to = end ?? from;
  return (
    <div className="web-file">
      {head}
      <div className="web-file__body">
        <table className="web-code">
          <tbody>
            {shown.map((text, index) => {
              const number = index + 1;
              const hit = number >= from && number <= to;
              return (
                <tr key={number} data-hit={hit ? 'true' : 'false'} {...(number === from ? { ref: marked } : {})}>
                  <td className="web-code__number">{number}</td>
                  <td className="web-code__text">{text}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {lines.length > MAX_LINES ? <p className="web-note">Showing the first {MAX_LINES} of {lines.length} lines.</p> : null}
      </div>
    </div>
  );
}
