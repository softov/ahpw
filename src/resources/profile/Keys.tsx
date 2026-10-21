import { useEffect, useState, type ReactElement } from 'react';
import { useI18n, useStore } from '@softov/scena/react';
import { ahpPaths } from '../../bridges/data.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import { readOwnUser, type Grant } from '../../bridges/people.js';
import { servesTokens } from '../../bridges/tokens.js';
import { MintForm } from './MintForm.js';
import { TokenList } from './TokenList.js';

/** The person's own minted tokens: *New key* above, and the list, which reads again after a mint. */
export function Keys({ host }: { host: string }): ReactElement {
  const { t } = useI18n();
  const offers = useStore<Offers>(ahpPaths(host).offers) ?? NO_OFFERS;
  const [reads, setReads] = useState(0);
  // The grants a key may be limited to; until they read, a key can still hold every grant.
  const [grants, setGrants] = useState<readonly Grant[]>([]);
  useEffect(() => {
    let live = true;
    readOwnUser(host, offers).then((user) => { if (live) setGrants(user.grants ?? []); }, () => undefined);
    return () => { live = false; };
  }, [host, offers]);

  if (!servesTokens(offers)) return <div className="web-profile__keys"><p className="web-note">{t('profile/keys/notServed')}</p></div>;
  return (
    <div className="web-profile__keys">
      <MintForm host={host} grants={grants} onMinted={() => setReads((one) => one + 1)} />
      <TokenList host={host} reads={reads} />
    </div>
  );
}
