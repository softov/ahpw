import { useEffect, useState, type ReactElement } from 'react';
import { getLocale } from '@softov/scena';
import { useI18n } from '@softov/scena/react';
import { Alert, Button, Spinner } from '@softov/scena/ui';
import { hostSaid } from '../../bridges/said.js';
import { listTokens, revokeToken, type ListedToken } from '../../bridges/tokens.js';
import { confirm } from '../../shell/notify/index.js';
import { RemovableChip } from '../../shell/view/RemovableChip.js';

interface TokenListProps {
  host: string;
  /** Whose tokens, when they are not the signed-in person's own. */
  user?: string;
  /** Changed by a mint, so the list reads again. */
  reads?: number;
  /** Told whether the host refused the list, so a form beside it can stand aside. */
  onRefused?: (refused: boolean) => void;
}

/** A day as the person's locale writes it. */
const dayOf = (at: number): string => new Date(at).toLocaleDateString(getLocale());

/**
 * The moment a token stops, with its time: an expiry is an instant, and a
 * date given as `2026-12-31` is midnight UTC, which is the day before west
 * of Greenwich.
 */
const momentOf = (at: number): string => new Date(at).toLocaleString(getLocale(), { dateStyle: 'medium', timeStyle: 'short' });

/**
 * A person's minted tokens, newest first: each one's label, the grants it is
 * limited to, when it was made and when it stops, and *Revoke*. A host that
 * refuses the list - a minted-token sign-in, a host with no tokens - says why
 * in its own words, as a note rather than an error.
 */
export function TokenList({ host, user, reads = 0, onRefused }: TokenListProps): ReactElement {
  const { t } = useI18n();
  const [tokens, setTokens] = useState<ListedToken[] | null>(null);
  const [refused, setRefused] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [again, setAgain] = useState(0);

  useEffect(() => {
    let live = true;
    setTokens(null);
    setRefused(null);
    listTokens(host, user).then(
      (held) => { if (live) { setTokens([...held].sort((a, b) => b.created - a.created)); onRefused?.(false); } },
      (caught: unknown) => { if (live) { setRefused(hostSaid(caught)); onRefused?.(true); } },
    );
    return () => { live = false; };
    // `onRefused` is the caller's setter; a new one is no reason to read again.
  }, [host, user, reads, again]);

  const revoke = async (token: ListedToken): Promise<void> => {
    const name = token.label ?? token.id;
    if (!(await confirm({
      title: t('profile/keys/revokeTitle', { name }),
      body: t('profile/keys/revokeBody'),
      confirmLabel: t('profile/keys/revoke'),
      tone: 'danger',
    }))) return;
    setFailure(null);
    try {
      await revokeToken(host, token.id, user);
      setAgain((one) => one + 1);
    } catch (caught) {
      setFailure(hostSaid(caught));
    }
  };

  if (refused !== null) return <p className="web-note">{refused}</p>;
  if (tokens === null) return <Spinner label={t('profile/keys/reading')} />;
  const now = Date.now();

  return (
    <div className="web-keys">
      {failure === null ? null : <Alert tone="danger" message={failure} />}
      {tokens.length === 0 ? <p className="web-note">{t('profile/keys/none')}</p> : (
        <ul className="web-keys__list">
          {tokens.map((token) => {
            const expired = token.expires !== undefined && token.expires <= now;
            return (
              <li key={token.id} className="web-keys__row" data-expired={expired ? 'true' : undefined}>
                <span className="web-keys__main">
                  <span className="web-keys__name">
                    {token.label ?? t('profile/keys/unnamed')}
                    <span className="web-keys__id">{token.id}</span>
                  </span>
                  <span className="web-keys__grants">
                    {token.grants === undefined
                      ? <span className="web-note">{user === undefined ? t('profile/keys/everyGrant') : t('profile/keys/everyGrantOf', { id: user })}</span>
                      : token.grants.map((grant) => <RemovableChip key={grant} label={grant} removeLabel={grant} />)}
                  </span>
                  <span className="web-keys__when">
                    {t('profile/keys/made', { day: dayOf(token.created) })}
                    {' \u{00B7} '}
                    {token.expires === undefined ? t('profile/keys/neverExpires')
                      : t(expired ? 'profile/keys/expired' : 'profile/keys/expires', { day: momentOf(token.expires) })}
                  </span>
                </span>
                <Button size="sm" variant="danger" label={t('profile/keys/revoke')} onClick={() => void revoke(token)} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
