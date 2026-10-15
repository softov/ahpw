import type { ReactElement } from 'react';
import { useI18n, useScena } from '@softov/scena/react';
import { Alert, Markdown, Spinner } from '@softov/scena/ui';
import { linkClicks } from './clicks.js';
import { imagesFrom } from './HostImage.js';
import { FileHead, useFileText } from './text.js';
import { PageAlert } from '../../shell/view/PageAlert.js';

/** The folder a file URI sits in, which its relative links start from. */
const folderOf = (uri: string): string => uri.replace(/\/[^/]*$/, '');

/** A markdown file, rendered. Its links and code spans that name files open as they do in chat, and its images are read, relative to its folder. */
export default function MarkdownPage({ uri }: { uri?: string }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const state = useFileText(uri);

  if (uri === undefined) return <PageAlert tone="warning" message={t('files/noFile')} />;
  const head = <FileHead uri={uri} />;
  if (state === null) return <div className="web-file">{head}<Spinner label={t('files/reading')} /></div>;
  if ('error' in state) return <div className="web-file">{head}<Alert tone="danger" title={t('files/notReadable')} message={state.error} /></div>;
  if (state.text === null) return <div className="web-file">{head}<p className="web-note">{t('files/notText')}</p></div>;

  return (
    <div className="web-file">
      {head}
      <div className="web-file__body">
        <div className="web-file__doc web-md" onClick={linkClicks(scena, folderOf(uri))}>
          <Markdown text={state.text} image={imagesFrom(folderOf(uri))} />
        </div>
      </div>
    </div>
  );
}
