/**
 * The icons a host sends beside a plugin's name and an adapter's title, in the
 * protocol's `Icon` shape. ahpd reads a package's file into a `data:` URI; an
 * `https:` icon it sends as it is, and that one is not drawn here, so a page
 * never asks a third party for an image.
 */

import type { Icon } from '@microsoft/agent-host-protocol';

export type { Icon };

/** The icon to draw on a light or a dark background, or nothing when none is a `data:` image. */
export function pickIcon(icons: readonly Icon[] | undefined, scheme: 'light' | 'dark'): Icon | undefined {
  const drawable = (icons ?? []).filter((icon) => typeof icon.src === 'string' && icon.src.startsWith('data:image/'));
  return drawable.find((icon) => icon.theme === scheme)
    ?? drawable.find((icon) => icon.theme === undefined)
    ?? drawable[0];
}
