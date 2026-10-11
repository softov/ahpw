import { windowControls } from '@ahpd/desk-client';
import { useEffect, useState, type ReactElement } from 'react';

/** Minimize, maximize or restore, and close, at the title bar's far end, as the OS draws them. */
export default function WindowControls(): ReactElement {
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    let live = true;
    const sync = async () => {
      const now = await windowControls.isMaximized();
      if (live) setMaximized(now);
    };
    void sync();
    const stop = windowControls.onResized(() => void sync());
    return () => {
      live = false;
      void stop.then((unlisten) => unlisten());
    };
  }, []);

  return (
    <div className="desk-controls">
      <button type="button" className="desk-control" title="Minimize" aria-label="Minimize" onClick={() => void windowControls.minimize()}>
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
          <path d="M0 5.5h10" stroke="currentColor" />
        </svg>
      </button>
      <button
        type="button"
        className="desk-control"
        title={maximized ? 'Restore' : 'Maximize'}
        aria-label={maximized ? 'Restore' : 'Maximize'}
        onClick={() => void windowControls.toggleMaximize()}
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
      <button type="button" className="desk-control desk-control--close" title="Close" aria-label="Close" onClick={() => void windowControls.close()}>
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
          <path d="M.5.5l9 9M9.5.5l-9 9" stroke="currentColor" />
        </svg>
      </button>
    </div>
  );
}
