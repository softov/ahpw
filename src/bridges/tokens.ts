/**
 * A person's minted tokens, through ahpd's `x-ahpd/tokens/*` commands.
 *
 * A signed-in person manages their own with no grant; naming another `user`
 * needs `user:write`, and grants that person holds. A connection that signed
 * in with a minted token is refused, and the host's sentence says why. A
 * token's secret is answered once, by the mint, and never kept here.
 */

import type { Grant, MintedToken, TokenRecord } from '@ahpd/sdk';
import { hostBridge } from './data.js';
import type { Offers } from './offers.js';

export type { MintedToken };

/** A token as a listing answers it: the record without its hash. */
export type ListedToken = Omit<TokenRecord, 'token'>;

export const TOKENS = { mint: 'x-ahpd/tokens/mint', list: 'x-ahpd/tokens/list', revoke: 'x-ahpd/tokens/revoke' } as const;

/** Whether a host keeps minted tokens: it offers their commands. */
export function servesTokens(offers: Offers): boolean {
  return offers.methods.includes(TOKENS.list);
}

/** `user` as a param, only when somebody else is named. */
const whose = (user: string | undefined): { user?: string } => (user === undefined ? {} : { user });

const isToken = (value: unknown): value is ListedToken => {
  const held = value as Partial<ListedToken> | null;
  return typeof held === 'object' && held !== null && typeof held.id === 'string' && typeof held.user === 'string' && typeof held.created === 'number';
};

/** The tokens the person holds, or `user` does. */
export async function listTokens(host: string, user?: string): Promise<ListedToken[]> {
  const answer = await hostBridge(host).request(TOKENS.list as never, whose(user) as never) as unknown;
  if (!Array.isArray(answer) || !answer.every(isToken)) throw new Error(`${TOKENS.list} answered no list of tokens`);
  return answer;
}

/** What a mint asks for; every part left out is the host's default: every grant, no label, no expiry. */
export interface MintWanted {
  user?: string;
  label?: string;
  grants?: Grant[];
  /** When it stops working, in epoch milliseconds. */
  expires?: number;
}

/** A new token, with its secret, answered this once. */
export async function mintToken(host: string, wanted: MintWanted): Promise<MintedToken> {
  const params = {
    ...whose(wanted.user),
    ...(wanted.label === undefined ? {} : { label: wanted.label }),
    ...(wanted.grants === undefined ? {} : { grants: wanted.grants }),
    ...(wanted.expires === undefined ? {} : { expires: wanted.expires }),
  };
  const answer = await hostBridge(host).request(TOKENS.mint as never, params as never) as unknown;
  if (!isToken(answer) || typeof (answer as Partial<MintedToken>).secret !== 'string') throw new Error(`${TOKENS.mint} answered no token with a secret`);
  return answer as MintedToken;
}

/** Revokes one token of the person's, or of `user`'s. */
export async function revokeToken(host: string, id: string, user?: string): Promise<void> {
  await hostBridge(host).request(TOKENS.revoke as never, { id, ...whose(user) } as never);
}
