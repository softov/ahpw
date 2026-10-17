import type { ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Button, Text } from '@softov/scena/ui';
import { readTrust, keepTrust, trustPath, withoutAnswer, type TrustAnswers } from '../../bridges/trust.js';
import { sendTrust } from '../../bridges/trust-ask.js';
import { folderLabel } from '../../bridges/words.js';
import { failed } from '../../shell/notify/index.js';

/**
 * The folders this browser answered about on the host, and a way to take an
 * answer back. Forgetting a yes tells the host at once, so it stops trusting
 * the folder; either way the folder is asked about again next time.
 */
export function TrustedFolders({ host }: { host: string }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const answers = useStore<TrustAnswers>(trustPath(host)) ?? readTrust(host);
  const rows = Object.entries(answers);

  const forget = (uri: string, trusted: boolean): void => {
    const next = withoutAnswer(answers, uri);
    if (!trusted) {
      keepTrust(scena.store, host, next);
      return;
    }
    sendTrust(scena.store, host, next).catch((error: unknown) => failed(t('trust/host/notForgotten'), error));
  };

  return (
    <>
      <Text variant="h3" text={t('trust/host/title')} />
      <p className="web-note">{t('trust/host/hint')}</p>
      {rows.length === 0 ? <p className="web-note">{t('trust/host/none')}</p> : (
        <table className="web-runs web-table web-trust">
          <thead>
            <tr><th>{t('trust/host/folder')}</th><th>{t('trust/host/answer')}</th><th aria-label={t('trust/host/forget')} /></tr>
          </thead>
          <tbody>
            {rows.map(([uri, trusted]) => (
              <tr key={uri}>
                <td><code>{folderLabel(uri)}</code></td>
                <td>{t(trusted ? 'trust/host/trusted' : 'trust/host/untrusted')}</td>
                <td className="web-trust__forget"><Button label={t('trust/host/forget')} size="sm" onClick={() => forget(uri, trusted)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
