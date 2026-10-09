import { type MouseEvent, type ReactElement } from 'react';
import { useScena } from '@softov/scena/react';
import { Alert, Markdown, Spinner } from '@softov/scena/ui';
import { fileLink } from './link.js';
import { FileHead, useFileText } from './text.js';

/** The folder a file URI sits in, which its relative links start from. */
const folderOf = (uri: string): string => uri.replace(/\/[^/]*$/, '');

/** A markdown file, rendered. Its relative links open beside it; web links open in a new browser tab. */
export default function MarkdownPage({ uri }: { uri?: string }): ReactElement {
  const scena = useScena();
  const state = useFileText(uri);

  if (uri === undefined) return <Alert tone="warning" message="No file was named." />;
  const head = <FileHead uri={uri} />;
  if (state === null) return <div className="web-file">{head}<Spinner label="Reading the file" /></div>;
  if ('error' in state) return <div className="web-file">{head}<Alert tone="danger" title="Not readable" message={state.error} /></div>;
  if (state.text === null) return <div className="web-file">{head}<p className="web-note">This file is not text.</p></div>;

  const onClick = (event: MouseEvent<HTMLElement>): void => {
    const anchor = (event.target as HTMLElement).closest('a');
    if (anchor === null) return;
    const href = anchor.getAttribute('href') ?? '';
    if (href.startsWith('#')) return;
    event.preventDefault();
    const target = fileLink(href, folderOf(uri));
    if (target !== null) void scena.commands.execute('ahp.openFile', { uri: target.uri, line: target.line, end: target.end });
    else if (/^(https?|mailto):/i.test(href)) window.open(href, '_blank', 'noopener');
  };

  return (
    <div className="web-file">
      {head}
      <div className="web-file__body">
        <div className="web-file__doc" onClick={onClick}>
          <Markdown text={state.text} />
        </div>
      </div>
    </div>
  );
}
