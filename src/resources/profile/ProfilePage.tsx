import type { ReactElement } from 'react';
import { useI18n, useStore } from '@softov/scena/react';
import { Tabs, Text } from '@softov/scena/ui';
import { ahpPaths } from '../../bridges/data.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import { personUri, selfId } from '../../bridges/people.js';
import { PageAlert } from '../../shell/view/PageAlert.js';
import { EMOJIcon } from '../emojis.js';
import { Info } from './Info.js';
import { Keys } from './Keys.js';
import { keepProfileTabKey, profileTabKey } from './state.js';

/** The signed-in person on one host: who they are and what they used, and their keys. */
export default function ProfilePage({ host }: { host: string }): ReactElement {
  const { t } = useI18n();
  const offers = useStore<Offers>(ahpPaths(host).offers) ?? NO_OFFERS;
  const id = selfId(offers);
  if (id === undefined) return <PageAlert tone="warning" message={t('profile/notices/notPerson')} />;

  return (
    <div className="web-page web-profile">
      <div className="web-role__title">
        <Text variant="h2" text={`${EMOJIcon.users} ${id}`} />
        <span className="web-role__uri">{personUri(offers, 'users', id)}</span>
      </div>
      <Tabs
        tabs={[
          { key: 'info', title: t('profile/tabs/info'), child: <Info host={host} /> },
          { key: 'keys', title: t('profile/tabs/keys'), child: <Keys host={host} /> },
        ]}
        defaultValue={profileTabKey()}
        onChange={keepProfileTabKey}
      />
    </div>
  );
}
