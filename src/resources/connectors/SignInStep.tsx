import { useEffect, useRef, useState, type ReactElement } from 'react';
import { useI18n } from '@softov/scena/react';
import { Alert, Button, TextField } from '@softov/scena/ui';
import { finishSignIn, startSignIn, type ConnectorRow, type ConnectorState, type ConnectorWanted, type SignInRow, type SignInStarted } from '../../bridges/connectors.js';
import { hostSaid } from '../../bridges/said.js';

/**
 * The sign-in under an adapter's fields: a button labelled by the host, then a
 * step where the person pastes the code the provider's page shows. Once it
 * finishes, the step says it is signed in and the connector's state, and
 * offers to sign in again. The code and the started sign-in live only in this
 * component's state, and are cleared when the step ends, however it ends.
 */
export function SignInStep({ host, signIn, provider, wanted, disabled, onDone }: {
  host: string;
  signIn: SignInRow;
  /** What the done step names as the provider: the adapter's title. */
  provider: string;
  /** The put the sign-in finishes as, with the config from `configForSignIn`. */
  wanted: ConnectorWanted;
  disabled: boolean;
  onDone: (row: ConnectorRow) => void;
}): ReactElement {
  const { t } = useI18n();
  const [started, setStarted] = useState<SignInStarted | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  /** The state of the connector the last sign-in finished as; null before one finishes. */
  const [signedIn, setSignedIn] = useState<ConnectorState | null>(null);

  // An answer that comes after the form closed is dropped, so a closed step finishes nothing.
  const live = useRef(true);
  useEffect(() => { live.current = true; return () => { live.current = false; }; }, []);

  const end = (): void => { setStarted(null); setCode(''); setBusy(false); };

  const start = (): void => {
    setBusy(true);
    setFailure(null);
    startSignIn(host, wanted).then(
      (next) => {
        if (!live.current) return;
        setBusy(false);
        setStarted(next);
        window.open(next.url, '_blank', 'noopener');
      },
      (caught: unknown) => { if (live.current) { end(); setFailure(hostSaid(caught)); } },
    );
  };

  const finish = (): void => {
    if (started === null) return;
    setBusy(true);
    finishSignIn(host, started.state, code).then(
      (row) => { if (live.current) { end(); setSignedIn(row.state); onDone(row); } },
      (caught: unknown) => { if (live.current) { end(); setFailure(hostSaid(caught)); } },
    );
  };

  return (
    <div className="web-connector-form__signin">
      {started === null && signedIn !== null ? (
        <>
          <p className="web-connector-form__signed-in">{t('connectors/signIn/done', { provider, state: t(`connectors/states/${signedIn}`) })}</p>
          <div className="web-connector-form__signin-start">
            <Button label={t('connectors/signIn/again')} disabled={disabled || busy} onClick={start} />
          </div>
        </>
      ) : started === null ? (
        <>
          <div className="web-connector-form__signin-start">
            <Button label={signIn.title} disabled={disabled || busy} onClick={start} />
          </div>
          <p className="web-note">{t('connectors/signIn/orType')}</p>
        </>
      ) : (
        <>
          <span className="web-connector-form__label">{signIn.title}</span>
          <p className="web-note">
            {t('connectors/signIn/step')}{' '}
            <a href={started.url} target="_blank" rel="noopener noreferrer">{t('connectors/signIn/openAgain')}</a>
          </p>
          <TextField label={t('connectors/signIn/code')} type="password" value={code} disabled={busy} onChange={setCode} />
          <div className="web-page__actions">
            <Button label={t('connectors/signIn/finish')} variant="primary" disabled={code === '' || busy} onClick={finish} />
            <Button label={t('connectors/signIn/cancel')} disabled={busy} onClick={end} />
          </div>
        </>
      )}
      {failure === null ? null : <Alert tone="danger" title={t('connectors/signIn/failed')} message={failure} />}
    </div>
  );
}
