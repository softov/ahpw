import { translate } from '@softov/scena';
import type { ReactiveStore } from '@softov/scena/types';
import { removeConnector, type ConnectorOwner, type ConnectorRow } from '../../bridges/connectors.js';
import { ahpPaths } from '../../bridges/data.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import { selfId } from '../../bridges/people.js';
import { confirm, failed } from '../../shell/notify/index.js';

/** The reader's own owner on a host, `user:<id>`, or nothing for a root connection. */
export function meOn(offers: Offers): ConnectorOwner | undefined {
  const id = selfId(offers);
  return id === undefined ? undefined : `user:${id}`;
}

/** The reader's own owner on a host, read from the store. */
export const meIn = (store: ReactiveStore, host: string): ConnectorOwner | undefined =>
  meOn(store.get<Offers>(ahpPaths(host).offers) ?? NO_OFFERS);

/** An owner in the reader's words: *Me*, *Team ...*, *The host*, or a person's id. */
export function ownerWord(t: (key: string, values?: Record<string, string>) => string, owner: ConnectorOwner, me: ConnectorOwner | undefined): string {
  if (owner === me) return t('connectors/owners/me');
  if (owner === 'host') return t('connectors/owners/host');
  if (owner.startsWith('team:')) return t('connectors/owners/team', { team: owner.slice('team:'.length) });
  return owner.slice('user:'.length);
}

/** Deletes a connector once a person has said yes; answers whether it went. */
export async function deleteConnector(host: string, row: ConnectorRow): Promise<boolean> {
  const title = row.title || row.id;
  if (!(await confirm({
    title: translate('connectors/actions/deleteTitle', { title }),
    body: translate('connectors/actions/deleteBody'),
    confirmLabel: translate('connectors/actions/delete'),
    tone: 'danger',
  }))) return false;
  try {
    await removeConnector(host, row.id);
    return true;
  } catch (error) {
    failed(translate('connectors/actions/deleteFailed', { title }), error);
    return false;
  }
}
