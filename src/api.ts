import type { CommandRequest } from './manifest/input.js';
import type { ProgramManifest } from './manifest/types.js';

/** Where the daemon's API is, on the origin that served this page. */
export const API_ROOT = '/api';

/** The localStorage key the token is kept under. */
const TOKEN_KEY = 'ahpd-web.token';

export function readToken(): string | null {
  try {
    const value = window.localStorage.getItem(TOKEN_KEY)?.trim();
    return value === undefined || value === '' ? null : value;
  } catch {
    return null;
  }
}

export function writeToken(token: string | null): void {
  try {
    if (token === null) window.localStorage.removeItem(TOKEN_KEY);
    else window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Storage blocked: the session lasts as long as the page.
  }
}

/** A refused or failed call, with the sentence the daemon answered. */
export class ApiError extends Error {
  public constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function send(path: string, init: RequestInit, token: string | null): Promise<unknown> {
  const headers = new Headers(init.headers);
  headers.set('accept', 'application/json');
  if (token !== null) headers.set('authorization', `Bearer ${token}`);
  let response: Response;
  try {
    response = await fetch(`${API_ROOT}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, 'The daemon did not answer.');
  }
  const text = await response.text();
  let parsed: unknown = null;
  if (text !== '') {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }
  if (!response.ok) {
    const message = typeof parsed === 'object' && parsed !== null && 'message' in parsed
      ? String((parsed as { message: unknown }).message)
      : `${init.method ?? 'GET'} ${path} answered ${response.status}`;
    throw new ApiError(response.status, message);
  }
  return parsed;
}

/** The daemon's command surface. Served without a token. */
export async function readManifest(): Promise<ProgramManifest> {
  return await send('/cli-manifest', {}, null) as ProgramManifest;
}

/** Run one command with the signed-in token, or the one given. */
export async function call(request: CommandRequest, token: string | null = readToken()): Promise<unknown> {
  return await send(request.path, {
    method: request.method,
    ...(request.body === undefined ? {} : { body: request.body }),
    ...(request.contentType === undefined ? {} : { headers: { 'content-type': request.contentType } }),
  }, token);
}
