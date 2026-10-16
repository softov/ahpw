import { useEffect, useState, type ReactElement } from 'react';
import { useI18n } from '@softov/scena/react';
import type { EmbedWindow } from './index.js';

/** Minimize, maximize or restore, and close, at the title bar's far end, as the OS draws them. */
export default function WindowControls({ controls }: { controls: EmbedWindow }): ReactElement {
  const { t } = useI18n();
  const [maximized, setMaximized] = useState(false);
  const sizeLabel = maximized ? t('shell/embed/restore') : t('shell/embed/maximize');

  useEffect(() => {
    let live = true;
    const sync = async () => {
      const now = await controls.isMaximized();
      if (live) setMaximized(now);
    };
    void sync();
    const stop = controls.onResized(() => void sync());
    return () => {
      live = false;
      stop();
    };
  }, [controls]);

  return (
    <div className="embed-controls">
      <button type="button" className="embed-control" title={t('shell/embed/minimize')} aria-label={t('shell/embed/minimize')} onClick={() => void controls.minimize()}>
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
          <path d="M0 5.5h10" stroke="currentColor" />
        </svg>
      </button>
      <button
        type="button"
        className="embed-control"
        title={sizeLabel}
        aria-label={sizeLabel}
        onClick={() => void controls.toggleMaximize()}
      >
        {maximized ? (
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
            <path d="M2.5 2.5V.5h7v7h-2M.5 2.5h7v7h-7z" fill="none" stroke="currentColor" />
          </svg>
        ) : (
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
            <path d="M.5.5h9v9h-9z" fill="none" stroke="currentColor" />
          </svg>
        )}
      </button>
      <button type="button" className="embed-control embed-control--close" title={t('shell/embed/close')} aria-label={t('shell/embed/close')} onClick={() => void controls.close()}>
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
          <path d="M.5.5l9 9M9.5.5l-9 9" stroke="currentColor" />
        </svg>
      </button>
    </div>
  );
}
