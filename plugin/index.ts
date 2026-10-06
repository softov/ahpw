import { fileURLToPath } from 'node:url';
import type { Plugin } from '@ahpd/sdk';
import { staticRoute } from './static.js';

/** The plugin's id, and the path it is served under: `/plugins/ahpd-web/`. */
export const name = 'ahpd-web';

/** What a listing prints. */
export const title = 'Web';

/** The built page, beside this file in the package. */
const APP = fileURLToPath(new URL('../app/', import.meta.url));

export const apply: Plugin['apply'] = (host) => {
  host.registerRoute(staticRoute(APP, `/plugins/${name}/`));
};
