import { useEffect, useRef, type ReactElement } from 'react';
import { useStore } from '@softov/scena/react';
import { Button } from '@softov/scena/ui';
import { CONFIRM_REQUEST, settle, type ConfirmRequest } from './confirm.js';

/**
 * The open question, over the page. The dialog takes focus, not its confirm
 * button, so Enter cannot answer yes before the question is read. Escape and a
 * click outside answer no.
 */
export function ConfirmDialog(): ReactElement | null {
  const request = useStore<ConfirmRequest | null>(CONFIRM_REQUEST);
  const card = useRef<HTMLDivElement>(null);
  const id = request?.id;

  useEffect(() => {
    if (id === undefined) return;
    card.current?.focus();
    const onKey = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      settle(false);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [id]);

  if (request === undefined || request === null) return null;
  return (
    <div className="web-confirm" onClick={() => settle(false)}>
      <div
        ref={card}
        tabIndex={-1}
        className="web-confirm__card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="web-confirm-title"
        {...(request.body === undefined ? {} : { 'aria-describedby': 'web-confirm-body' })}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="web-confirm-title" className="web-confirm__title">{request.title}</h2>
        {request.body === undefined ? null : <p id="web-confirm-body" className="web-confirm__body">{request.body}</p>}
        <div className="web-confirm__buttons">
          <Button type="button" size="sm" variant="ghost" onClick={() => settle(false)}>{request.cancelLabel}</Button>
          <Button type="button" size="sm" variant={request.tone === 'danger' ? 'danger' : 'primary'} onClick={() => settle(true)}>{request.confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}
