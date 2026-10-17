/**
 * Which folders this browser trusts on each host.
 *
 * ahpd treats a folder as untrusted until the connection pushes
 * `workspaceTrust`, and keeps the push on that connection only, so the answers
 * live here and go to the host on every connect. A no is kept with the yeses,
 * so a folder is asked about once; only the yeses are sent, since untrusted is
 * what the host assumes.
 */

import type { BindingPath, ReactiveStore } from '@softov/scena/types';
import type { StateAction } from '@microsoft/agent-host-protocol';
import { perHostKey } from '../lib/storage-keys.js';
import { bare } from '../resources/folders/roots.js';
import { folderUri } from './words.js';

/** `{ [folderUri]: trusted }`, each folder spelled once. */
export type TrustAnswers = Readonly<Record<string, boolean>>;

/** Where the store keeps a host's answers. */
export const trustPath = (host: string): BindingPath => `$/ahp/trust/${encodeURIComponent(host)}` as BindingPath;

const trustKey = (host: string): string => perHostKey('ahpd-web.trust', host);

/** One folder, one spelling: its URI with no trailing slash, whether it came as a path or a URI. */
export const trustKeyOf = (folder: string): string => bare(folderUri(folder));

/** A host's answers, from storage; none when storage is blocked or holds something else. */
export function readTrust(host: string): TrustAnswers {
  try {
    const held = JSON.parse(window.localStorage.getItem(trustKey(host)) ?? '{}') as unknown;
    if (typeof held !== 'object' || held === null || Array.isArray(held)) return {};
    return Object.fromEntries(Object.entries(held).filter((one): one is [string, boolean] => typeof one[1] === 'boolean'));
  } catch {
    return {};
  }
}

/** Keep a host's answers, in the store and in storage. */
export function keepTrust(store: ReactiveStore, host: string, answers: TrustAnswers): void {
  store.set(trustPath(host), answers);
  try {
    window.localStorage.setItem(trustKey(host), JSON.stringify(answers));
  } catch {
    // Storage blocked: the answers last as long as the page.
  }
}

/** What this browser answered about a folder, or undefined when it was never asked. */
export function answerOf(answers: TrustAnswers | undefined, folder: string): boolean | undefined {
  return answers?.[trustKeyOf(folder)];
}

export function withAnswer(answers: TrustAnswers, folder: string, trusted: boolean): TrustAnswers {
  return { ...answers, [trustKeyOf(folder)]: trusted };
}

export function withoutAnswer(answers: TrustAnswers, folder: string): TrustAnswers {
  const key = trustKeyOf(folder);
  return Object.fromEntries(Object.entries(answers).filter(([uri]) => uri !== key));
}

/** The folders answered yes, which is all the host is told. */
export function trustedUris(answers: TrustAnswers): string[] {
  return Object.entries(answers).filter(([, trusted]) => trusted).map(([uri]) => uri);
}

/** The push that tells a host which folders this browser trusts; it replaces the host's list for this connection. */
export function trustAction(uris: readonly string[]): StateAction {
  return { type: 'root/configChanged', config: { workspaceTrust: { enabled: true, trustedUris: [...uris] } } } as StateAction;
}
