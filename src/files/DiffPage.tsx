import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { useScena } from '@softov/scena/react';
import { Alert, Button, Spinner } from '@softov/scena/ui';
import { readText } from '../connection/data.js';
import { folderLabel } from '../connection/words.js';
import { countChanges, diffLines, hunkHeader } from './diff.js';

/** Read one side of an edit; a side that does not exist is empty. */
const side = async (uri: string | undefined): Promise<string | null> => (uri === undefined ? '' : (await readText(uri)).text);

/** An edit to one file: both sides read from the daemon, diffed here. */
export default function DiffPage({ file, before, after }: { file?: string; before?: string; after?: string }): ReactElement {
  const scena = useScena();
  const [sides, setSides] = useState<{ before: string | null; after: string | null } | { error: string } | null>(null);

  useEffect(() => {
    let alive = true;
    setSides(null);
    Promise.all([side(before), side(after)])
      .then(([was, is]) => { if (alive) setSides({ before: was, after: is }); })
      .catch((error: unknown) => { if (alive) setSides({ error: error instanceof Error ? error.message : String(error) }); });
    return () => { alive = false; };
  }, [before, after]);

  const hunks = useMemo(
    () => (sides === null || 'error' in sides || sides.before === null || sides.after === null ? [] : diffLines(sides.before, sides.after)),
    [sides],
  );

  const path = file === undefined ? '' : folderLabel(file);
  const counts = countChanges(hunks);
  const head = (
    <div className="web-file__head">
      <code>{path}</code>
      {sides !== null && !('error' in sides) ? (
        <span>
          <span className="web-diff--add">+{counts.added}</span> <span className="web-diff--remove">-{counts.removed}</span>
          {before === undefined ? ' \u{00B7} new file' : after === undefined ? ' \u{00B7} deleted' : ''}
        </span>
      ) : null}
      {file === undefined || after === undefined ? null : (
        <Button label="Open file" size="sm" onClick={() => void scena.commands.execute('ahp.openFile', { uri: file })} />
      )}
    </div>
  );

  if (sides === null) return <div className="web-file">{head}<Spinner label="Reading both sides" /></div>;
  if ('error' in sides) return <div className="web-file">{head}<Alert tone="danger" title="Not readable" message={sides.error} /></div>;
  if (sides.before === null || sides.after === null) return <div className="web-file">{head}<p className="web-note">This file is not text.</p></div>;
  if (hunks.length === 0) return <div className="web-file">{head}<p className="web-note">No changes.</p></div>;

  return (
    <div className="web-file">
      {head}
      <div className="web-file__body">
        <table className="web-code web-diff">
          <tbody>
            {hunks.map((hunk, index) => [
              <tr key={`h${index}`} className="web-diff__hunk"><td colSpan={3}>{hunkHeader(hunk)}</td></tr>,
              ...hunk.lines.map((one, row) => (
                <tr key={`${index}:${row}`} data-kind={one.kind}>
                  <td className="web-code__number">{one.before ?? ''}</td>
                  <td className="web-code__number">{one.after ?? ''}</td>
                  <td className="web-code__text">{one.kind === 'add' ? '+' : one.kind === 'del' ? '-' : ' '}{one.text}</td>
                </tr>
              )),
            ])}
          </tbody>
        </table>
      </div>
    </div>
  );
}
