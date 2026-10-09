import type { PortaProvider, Session } from '@softov/scena/porta';
import { readServer, readToken, writeToken } from './api.js';
// import { ApiError, call, readManifest } from './api.js';
// import { needsInput, requestOf } from './manifest/input.js';

export const TOKEN_PROVIDER_ID = 'ahpd-token';

/** What every signed-in session holds; the wall checks for it. */
export const SIGNED_IN = 'ahpd.signed-in';

/**
 * Keeps the token for the AHP socket, which is what accepts or refuses it:
 * a refused token shows as a connection that failed.
 */
async function check(token: string): Promise<Session> {
  writeToken(token);
  return {
    userId: 'token',
    displayName: 'AHP',
    permissions: [SIGNED_IN],
  };
}

// ahpd's check, through /api/cli-manifest; off while ahpw is AHP only.
// /**
//  * Whether the daemon accepts a token.
//  *
//  * Asked with the first read the manifest offers that takes no input. A 401 is
//  * a token the daemon does not know; any other answer, a 403 included, is one
//  * it knows, whose grants each command checks for itself.
//  */
// async function check(token: string): Promise<Session> {
//   const manifest = await readManifest();
//   const probe = manifest.commands.find((command) => command.http.method === 'GET' && !needsInput(command));
//   if (probe !== undefined) {
//     try {
//       await call(requestOf(probe, {}), token);
//     } catch (error) {
//       if (error instanceof ApiError && error.status === 401) throw new Error('That token was refused.');
//       if (!(error instanceof ApiError) || error.status === 0) throw error;
//     }
//   }
//   writeToken(token);
//   return {
//     userId: 'token',
//     displayName: `${manifest.program.name} ${manifest.program.version}`,
//     permissions: [SIGNED_IN],
//   };
// }

export function tokenProvider(): PortaProvider {
  return {
    id: TOKEN_PROVIDER_ID,
    label: 'Sign in',
    kind: 'form-fields',
    fields: [
      {
        name: 'token',
        label: 'Token',
        type: 'password',
        required: true,
        autoComplete: 'current-password',
      },
    ],
    async signin(credentials): Promise<Session> {
      const token = String((credentials as { token?: unknown }).token ?? '').trim();
      if (token === '') throw new Error('A token is required.');
      return await check(token);
    },
    async signout(): Promise<void> {
      writeToken(null);
    },
  };
}

/**
 * The session a stored token still stands for, checked again rather than trusted.
 *
 * When the server that sent the page adds the token itself, the page is signed
 * in without one.
 */
export async function restoreSession(): Promise<Session | null> {
  if (await readServer()) return { userId: 'server', displayName: 'AHP', permissions: [SIGNED_IN] };
  const token = readToken();
  if (token === null) return null;
  try {
    return await check(token);
  } catch (error) {
    if (error instanceof Error && error.message === 'That token was refused.') writeToken(null);
    return null;
  }
}
