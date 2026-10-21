import type { ReactElement } from 'react';
import { useI18n } from '@softov/scena/react';

/** The person's own tokens. Listed, minted and revoked once the token bridge is in (organization/05, tasks 04 and 05). */
export function Keys(_props: { host: string }): ReactElement {
  const { t } = useI18n();
  return (
    <div className="web-profile__keys">
      <p className="web-note">{t('profile/keys/soon')}</p>
    </div>
  );
}
