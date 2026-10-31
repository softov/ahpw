import { getLocale } from '@softov/scena';
import type { Disposable, Scena } from '@softov/scena/types';
import { ahpPaths, hostBridge, windowHost, type Connection } from '../../bridges/data.js';
import { allows, type Offers } from '../../bridges/offers.js';
import { embedder } from '../embed/index.js';
import { granted } from './browser-channel.js';

/**
 * Push with the tab closed: the browser subscribes with the host's VAPID key,
 * and the host keeps the subscription as a device under `push://devices`.
 */

/** Which sessions a device hears about: every session of its person, or only the ones this device opened. */
export type Audience = 'person' | 'device';

/** `on` while push is turned on in this browser; absent while it is off. */
const PUSH_KEY = 'ahpw.push';
/** The device's audience; `person` while absent. */
const AUDIENCE_KEY = 'ahpw.pushAudience';
/** The id this browser's device has on a host, made at the first use. */
const INSTALL_KEY = 'ahpw.pushInstall';

function kept(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function keep(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // A browser that keeps nothing asks again on the next load.
  }
}

/** Whether this page can push: a browser with the Push API, and no embedder, which shows the alerts itself. */
export function pushSupported(): boolean {
  return embedder === undefined && typeof window !== 'undefined' && 'PushManager' in window && typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
}

export const pushOn = (): boolean => kept(PUSH_KEY) === 'on';

export const audience = (): Audience => (kept(AUDIENCE_KEY) === 'device' ? 'device' : 'person');

function installId(): string {
  const held = kept(INSTALL_KEY);
  if (held !== null && held !== '') return held;
  const made = crypto.randomUUID();
  keep(INSTALL_KEY, made);
  return made;
}

const deviceUri = (): string => `push://devices/${installId()}`;

/** Whether the host keeps devices: its offers have a `push` provider that allows `write`. */
export function servesPush(offers: Offers | undefined): boolean {
  const provider = offers?.providers['push'];
  return provider !== undefined && allows(provider, 'write');
}

/** The bytes of a base64url string. */
export function fromBase64Url(text: string): Uint8Array {
  const plain = atob(text.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(text.length / 4) * 4, '='));
  return Uint8Array.from(plain, (char) => char.charCodeAt(0));
}

/** Whether a subscription was made with the key `wanted`. */
export function sameKey(held: ArrayBuffer | null, wanted: Uint8Array): boolean {
  if (held === null || held.byteLength !== wanted.length) return false;
  const bytes = new Uint8Array(held);
  return bytes.every((byte, at) => byte === wanted[at]);
}

/** The folder ahpw is served from, and the scope of the host's service worker under it. */
function places(host: string): { script: string; scope: string } {
  const base = new URL('./', document.baseURI);
  return { script: new URL('sw.js', base).href, scope: new URL(`push/${encodeURIComponent(host)}/`, base).href };
}

/** The host's subscription, made with its current key: an old one under another key is replaced. */
async function subscription(host: string): Promise<PushSubscription> {
  const { publicKey } = JSON.parse((await hostBridge(host).readText('push://vapid')).text ?? '{}') as { publicKey?: string };
  if (typeof publicKey !== 'string' || publicKey === '') throw new Error('push://vapid gave no key');
  const key = fromBase64Url(publicKey);
  const { script, scope } = places(host);
  const registration = await navigator.serviceWorker.register(script, { scope });
  const held = await registration.pushManager.getSubscription();
  if (held !== null && sameKey(held.options.applicationServerKey, key)) return held;
  await held?.unsubscribe();
  return registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key as BufferSource });
}

/** Subscribes on the host and writes its device there. */
export async function pushOnHost(host: string): Promise<void> {
  const { endpoint, keys } = (await subscription(host)).toJSON();
  if (endpoint === undefined || keys?.['p256dh'] === undefined || keys['auth'] === undefined) throw new Error('The browser gave no subscription');
  const device = { platform: 'web', endpoint, keys: { p256dh: keys['p256dh'], auth: keys['auth'] }, lang: getLocale(), audience: audience() };
  await hostBridge(host).writeText(deviceUri(), JSON.stringify(device));
}

/** Removes the device from the host and ends the browser's subscription. */
async function pushOffHost(host: string): Promise<void> {
  try {
    await hostBridge(host).deleteResource(deviceUri(), false);
  } finally {
    const registration = await navigator.serviceWorker.getRegistration(places(host).scope);
    await (await registration?.pushManager.getSubscription())?.unsubscribe();
  }
}

/** Turns push on for the window's host; it stays off when the host refuses. */
export async function enablePush(): Promise<void> {
  await pushOnHost(windowHost());
  keep(PUSH_KEY, 'on');
}

/** Turns push off: the device leaves the host, whatever the host answers. */
export async function disablePush(): Promise<void> {
  keep(PUSH_KEY, null);
  await pushOffHost(windowHost());
}

/** Switches the audience, and tells the host when push is on. */
export async function switchAudience(): Promise<Audience> {
  const next: Audience = audience() === 'person' ? 'device' : 'person';
  keep(AUDIENCE_KEY, next);
  if (pushOn()) await pushOnHost(windowHost());
  return next;
}

/**
 * While push is on, writes the device again each time the host connects, and
 * subscribes again when the browser dropped the subscription. The service
 * worker has no socket to the host, so only the page can do it.
 */
export function keepPushing(scena: Scena): Disposable {
  if (!pushSupported()) return { dispose: () => undefined };
  const host = windowHost();
  const path = ahpPaths(host).connection;
  let wasUp = false;
  return scena.store.subscribe(path, () => {
    const up = scena.store.get<Connection>(path)?.status === 'connected';
    if (up && !wasUp && pushOn() && granted() && servesPush(scena.store.get<Offers>(ahpPaths(host).offers))) void pushOnHost(host).catch(() => undefined);
    wasUp = up;
  });
}
