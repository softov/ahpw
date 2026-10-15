import { fileURLToPath } from 'node:url';
import type { Plugin } from '@ahpd/sdk';
import { staticRoute } from './static.js';

/** The plugin's id, and the path it is served under: `/plugins/web/`. */
export const name = 'web';

/** What a listing prints. */
export const title = 'Web';

/** The built page, beside this file in the package. */
const APP = fileURLToPath(new URL('../app/', import.meta.url));

/** Where the page is served. */
const PREFIX = `/plugins/${name}/`;

/**
 * What the page asks first: whether the server adds the token. The daemon does
 * not, so it says so, as `ahpw serve` answers the same file, rather than a 404
 * the browser prints as an error on every load.
 */
const ABOUT = JSON.stringify({ tokenHeld: false });

export const apply: Plugin['apply'] = (host) => {
  const files = staticRoute(APP, PREFIX);
  host.registerRoute(async (request) => {
    if (new URL(request.url).pathname !== `${PREFIX}ahpw.json`) return await files(request);
    return new Response(ABOUT, { headers: { 'content-type': 'application/json', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } });
  });
};
