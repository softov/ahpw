import { useEffect, useState, type ReactElement } from 'react';
import { canvasReducer, chatReducer, type CanvasState, type ChatState } from '@microsoft/agent-host-protocol';
import { useI18n, useScena } from '@softov/scena/react';
import { useChannel } from '../../bridges/channel.js';
import { SANDBOX } from '../../shell/browser/sandbox.js';
import { EMOJIcon } from '../emojis.js';
import { canvasKey, canvasName } from './canvases.js';

/**
 * A canvas: its page in an iframe, with the Browser view's sandbox, under a
 * bar with its name, its status, a reload and a way out to a new tab. A new
 * `url` loads the page again; with none, the view says the page is not
 * available. The view closes when the canvas leaves its chat.
 */
export default function CanvasView({ host, chat, resource }: { host: string; chat: string; resource: string }): ReactElement {
  const { t } = useI18n();
  const scena = useScena();
  const { state } = useChannel<CanvasState>(host, resource, canvasReducer);
  const { state: chatState } = useChannel<ChatState>(host, chat, chatReducer);
  // A new value loads the iframe again: a page from another origin cannot be told to reload.
  const [loads, setLoads] = useState(0);
  const gone = chatState !== undefined && !(chatState.canvases ?? []).some((one) => one.resource === resource);
  const key = canvasKey(host, resource);

  useEffect(() => {
    if (gone) scena.surfaces.close(key);
  }, [gone, scena, key]);

  const url = state?.url;
  const name = canvasName(state) ?? t('canvases/tab');
  const button = (icon: string, label: string, run: () => void, disabled: boolean): ReactElement => (
    <button type="button" className="web-explorer__action" title={label} aria-label={label} disabled={disabled} onClick={run}>
      <span className="web-explorer__icon">{icon}</span>
    </button>
  );

  return (
    <div className="web-browser">
      <div className="web-browser__bar">
        <span className="web-canvas__name">{name}</span>
        {state?.status === undefined || state.status === '' ? null : <span className="web-note">{state.status}</span>}
        <span className="web-explorer__actions web-canvas__actions">
          {button(EMOJIcon.reload, t('common/reload'), () => setLoads((n) => n + 1), url === undefined)}
          {url === undefined ? (
            button(EMOJIcon.external, t('shell/browser/openOutside'), () => undefined, true)
          ) : (
            <a className="web-explorer__action" href={url} target="_blank" rel="noopener noreferrer" title={t('shell/browser/openOutside')} aria-label={t('shell/browser/openOutside')}>
              <span className="web-explorer__icon">{EMOJIcon.external}</span>
            </a>
          )}
        </span>
      </div>
      <div className="web-browser__page">
        {url === undefined ? (
          <div className="web-browser__empty">
            <p className="web-browser__emptyTitle">{t('canvases/view/unavailable')}</p>
            <p className="web-note">{t('canvases/view/unavailableBody')}</p>
          </div>
        ) : (
          <iframe key={`${loads}:${url}`} className="web-browser__frame" src={url} title={name} sandbox={SANDBOX} referrerPolicy="strict-origin-when-cross-origin" />
        )}
      </div>
    </div>
  );
}
