/**
 * Whether this page runs in an app window of ahp-desk. There, the desk holds
 * the host and its token, and the window has no OS frame, so ahpw draws one.
 * Asked once: a page never moves between the desk and a browser.
 */

import { isDesk } from '@ahpd/desk-client';

export const onDesk = isDesk();
