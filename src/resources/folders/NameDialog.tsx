import { useEffect, useRef, useState, type ReactElement } from 'react';
import { useI18n, useStore } from '@softov/scena/react';
import { Button, TextField } from '@softov/scena/ui';
import { NAME_REQUEST, nameCheck, settleName, type NameRequest } from './ask.js';

/** The open name question, over the page, drawn like the confirm dialog. */
export function NameDialog(): ReactElement | null {
  const request = useStore<NameRequest | null>(NAME_REQUEST);
  if (request === undefined || request === null) return null;
  return <NameCard key={request.id} request={request} />;
}

/**
 * One question. The box takes focus with the name selected and its extension
 * left out; Enter answers, Escape and a click outside answer nothing. A problem
 * with the name shows under the box once it is sent.
 */
function NameCard({ request }: { request: NameRequest }): ReactElement {
  const { t } = useI18n();
  const card = useRef<HTMLFormElement>(null);
  const [value, setValue] = useState(request.value);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    const box = card.current?.querySelector('input');
    box?.focus();
    const dot = request.value.lastIndexOf('.');
    box?.setSelectionRange(0, dot > 0 ? dot : request.value.length);
    const onKey = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      settleName(null);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);

  const send = (): void => {
    const found = nameCheck(value);
    if (found === null) settleName(value);
    else setProblem(found);
  };
  return (
    <div className="web-confirm" onClick={() => settleName(null)}>
      <form
        ref={card}
        className="web-confirm__card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="web-name-title"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
      >
        <h2 id="web-name-title" className="web-confirm__title">{request.title}</h2>
        <TextField
          label={request.label}
          value={value}
          {...(problem === null ? {} : { error: problem })}
          onChange={(next) => {
            setValue(next);
            setProblem(null);
          }}
        />
        <div className="web-confirm__buttons">
          <Button type="button" size="sm" variant="ghost" onClick={() => settleName(null)}>{t('folders/ask/cancel')}</Button>
          <Button type="submit" size="sm" variant="primary">{request.confirmLabel}</Button>
        </div>
      </form>
    </div>
  );
}
