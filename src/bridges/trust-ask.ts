/**
 * Asking whether to trust a folder, and telling the host.
 *
 * A folder is asked about once per host: a kept yes or no answers at once. A
 * yes is kept only once the host takes the list that holds it, so a host that
 * refuses leaves the question standing; a no is kept at once, since untrusted
 * is what the host already assumes; closing the question keeps nothing.
 */

import { translate } from '@softov/scena';
import type { ReactiveStore } from '@softov/scena/types';
import { choose } from '../shell/notify/confirm.js';
import { failed } from '../shell/notify/index.js';
import { hostBridge, ROOT } from './data.js';
import { answerOf, keepTrust, readTrust, trustAction, trustedUris, trustPath, withAnswer, type TrustAnswers } from './trust.js';
import { folderLabel, folderName } from './words.js';

export type TrustOutcome = 'trusted' | 'untrusted' | 'closed';

/** A host's answers, as the store holds them since its last connect. */
export const answersOf = (store: ReactiveStore, host: string): TrustAnswers => store.get<TrustAnswers>(trustPath(host)) ?? readTrust(host);

/** Tell the host the folders `next` trusts, and keep `next` once it takes them; a refusal throws with the host's words. */
export async function sendTrust(store: ReactiveStore, host: string, next: TrustAnswers): Promise<void> {
  const refused = await hostBridge(host).dispatchAndWait(ROOT, trustAction(trustedUris(next)));
  if (refused !== null) throw new Error(refused);
  keepTrust(store, host, next);
}

/** Whether `folder` is trusted on `host`: the kept answer, or the person's, asked now. A host refusing a yes throws. */
export async function askTrust(store: ReactiveStore, host: string, folder: string): Promise<TrustOutcome> {
  const answers = answersOf(store, host);
  const held = answerOf(answers, folder);
  if (held !== undefined) return held ? 'trusted' : 'untrusted';
  const said = await choose({
    title: translate('trust/ask/title', { folder: folderName(folder) }),
    body: translate('trust/ask/body', { path: folderLabel(folder) }),
    confirmLabel: translate('trust/ask/yes'),
    cancelLabel: translate('trust/ask/no'),
  });
  if (said === null) return 'closed';
  if (!said) {
    keepTrust(store, host, withAnswer(answers, folder, false));
    return 'untrusted';
  }
  await sendTrust(store, host, withAnswer(answers, folder, true));
  return 'trusted';
}

/** The host's own question, before a session moves to or adds a folder: the same prompt, where anything but a yes is a no. */
export async function answerTrust(store: ReactiveStore, host: string, folder: string): Promise<boolean> {
  try {
    return (await askTrust(store, host, folder)) === 'trusted';
  } catch (error) {
    failed(translate('trust/ask/refused'), error);
    return false;
  }
}
