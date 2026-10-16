import { AhpErrorCodes } from '@microsoft/agent-host-protocol';
import { translate } from '@softov/scena';

/** Past this many characters a file is cut and kept read-only, so a log does not freeze the page. */
export const MAX_CHARS = 5_000_000;

/** The part of a file the editor shows, and whether the rest was left out. */
export function shownText(text: string): { text: string; cut: boolean } {
  return text.length > MAX_CHARS ? { text: text.slice(0, MAX_CHARS), cut: true } : { text, cut: false };
}

/** Whether a failed write is the host refusing this file, not a write that went wrong. */
export function refusesWrite(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: unknown }).code === AhpErrorCodes.PermissionDenied;
}

/** Why a read failed, in words: a file gone or refused says so, anything else keeps the host's own message. */
export function readFailure(error: unknown): string {
  const code = typeof error === 'object' && error !== null ? (error as { code?: unknown }).code : undefined;
  if (code === AhpErrorCodes.NotFound) return translate('files/gone');
  if (code === AhpErrorCodes.PermissionDenied) return translate('files/readRefused');
  return error instanceof Error ? error.message : String(error);
}

/** Whether a failed write is the file having changed on the host since it was read. */
export function changedOnHost(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: unknown }).code === AhpErrorCodes.Conflict;
}
