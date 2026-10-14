import { hostKey } from '../storage-keys.js';

/** Where the new session box keeps whether its tray of once-per-session choices is open, per host. */
export const TRAY_KEY = hostKey('ahpd-web.new-tray');

/** Open unless it was folded; open when storage is blocked. */
export function readTrayOpen(): boolean {
  try {
    return window.localStorage.getItem(TRAY_KEY) !== 'closed';
  } catch {
    return true;
  }
}

export function writeTrayOpen(open: boolean): void {
  try {
    window.localStorage.setItem(TRAY_KEY, open ? 'open' : 'closed');
  } catch {
    // Storage blocked: the tray stays as it is until the page goes.
  }
}
