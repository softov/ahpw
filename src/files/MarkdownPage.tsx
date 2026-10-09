import type { ReactElement } from 'react';
import { useScena } from '@softov/scena/react';
import { Alert, Markdown, Spinner } from '@softov/scena/ui';
import { linkClicks } from './clicks.js';
import { FileHead, useFileText } from './text.js';

/** The folder a file URI sits in, which its relative links start from. */
const folderOf = (uri: string): string => uri.replace(/\/[^/]*$/, '');

/** A markdown file, rendered. Its links and code spans that name files open as they do in chat, relative to its folder. */
export default function MarkdownPage({ uri }: { uri?: string }): ReactElement {
  const scena = useScena();
  const state = useFileText(uri);

  if (uri === undefined) return <Alert tone="warning" message="No file was named." />;
  const head = <FileHead uri={uri} />;
  if (state === null) return <div className="web-file">{head}<Spinner label="Reading the file" /></div>;
  if ('error' in state) return <div className="web-file">{head}<Alert tone="danger" title="Not readable" message={state.error} /></div>;
  if (state.text === null) return <div className="web-file">{head}<p className="web-note">This file is not text.</p></div>;

  return (
    <div className="web-file">
      {head}
      <div className="web-file__body">
        <div className="web-file__doc web-md" onClick={linkClicks(scena, folderOf(uri))}>
          <Markdown text={state.text} />
        </div>
      </div>
    </div>
  );
}
