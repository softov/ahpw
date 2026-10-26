/**
 * The screenshots that have been taken, read from `docs/public/shots/` when the site is built.
 *
 * A screenshot is a pair, `<id>-light.png` and `<id>-dark.png`. `Shot.vue`
 * shows the pair when both are here, and a box naming the screenshot when not.
 */

import { basename } from 'node:path';

declare const data: string[];
export { data };

export default {
  watch: ['../../public/shots/*.png'],
  load(files: string[]): string[] {
    return files.map((file) => basename(file)).sort();
  },
};
