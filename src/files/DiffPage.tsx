import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { useScena } from '@softov/scena/react';
import { Alert, Button, Spinner } from '@softov/scena/ui';
import { readText } from '../connection/data.js';
import { folderLabel } from '../connection/words.js';
import { countChanges, diffLines, hunkHeader } from './diff.js';
import { iconOf, scoped, useChangeset } from '../changes/changeset.js';

/** Read one side of an edit; a side that does not exist is empty. */
const side = async (uri: string | undefined): Promise<string | null> => (uri === undefined ? '' : (await readText(uri)).text);

/** An edit to one file: both sides read from the host, diffed here, with the host's operations on it when its changeset is named. */
export default function DiffPage({ file, before, after, changeset, change, review }: {
  file?: string;
  before?: string;
  after?: string;
  changeset?: string;
  change?: string | null;
  review?: boolean;
}): ReactElement {
  const scena = useScena();
  const changes = useChangeset(changeset);
  const current = changes.files.find((one) => one.id === change);
  const fileOps = current === undefined ? [] : changes.operations.filter((one) => scoped(one, 'resource'));
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
      <span className="web-file__actions">
        {review === true && current !== undefined ? (
          <label className="web-file__viewed">
            <input type="checkbox" checked={current.reviewed} onChange={(event) => changes.review([current], event.target.checked)} />
            Viewed
          </label>
        ) : null}
        {current === undefined ? null : fileOps.map((operation) => (
          <Button
            key={operation.id}
            label={`${iconOf(operation)} ${operation.label}`}
            size="sm"
            disabled={String(operation.status) === 'running'}
            onClick={() => void changes.run(operation, current)}
          />
        ))}
        {file === undefined || after === undefined ? null : (
          <Button label="Open file" size="sm" onClick={() => void scena.commands.execute('ahp.openFile', { uri: file })} />
        )}
      </span>
    </div>
  );
  const said = changes.said === null ? null : <Alert tone={changes.said.tone} message={changes.said.text} />;

  if (sides === null) return <div className="web-file">{head}{said}<Spinner label="Reading both sides" /></div>;
  if ('error' in sides) return <div className="web-file">{head}{said}<Alert tone="danger" title="Not readable" message={sides.error} /></div>;
  if (sides.before === null || sides.after === null) return <div className="web-file">{head}{said}<p className="web-note">This file is not text.</p></div>;
  if (hunks.length === 0) return <div className="web-file">{head}{said}<p className="web-note">No changes.</p></div>;

  return (
    <div className="web-file">
      {head}
      {said}
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
