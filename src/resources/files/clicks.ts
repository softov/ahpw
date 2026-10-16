import type { MouseEvent } from 'react';
import type { Scena } from '@softov/scena/types';
import { hostBridge } from '../../bridges/data.js';
import { codePath, fileLink, type FileTarget } from './link.js';

/** Opens what a link names: a folder in the explorer, a file in a tab at its lines. */
async function openTarget(scena: Scena, host: string, target: FileTarget, missing: 'open' | 'skip'): Promise<void> {
  const kind = await hostBridge(host).kindOfResource(target.uri);
  if (kind === 'directory') void scena.commands.execute('ahp.revealFolder', { host, uri: target.uri });
  else if (kind !== null || missing === 'open') void scena.commands.execute('ahp.openFile', { host, uri: target.uri, line: target.line, end: target.end });
}

/**
 * Clicks inside rendered markdown: a link or a code span that names a file or
 * folder on the host `host` opens it, relative paths from `base`, and a web link opens in a new
 * browser tab. A code span opens only what exists, since most are not paths.
 */
export function linkClicks(scena: Scena, host: string, base: string | null): (event: MouseEvent<HTMLElement>) => void {
  return (event) => {
    const element = event.target as HTMLElement;
    const anchor = element.closest('a');
    if (anchor !== null) {
      const href = anchor.getAttribute('href') ?? '';
      if (href.startsWith('#')) return;
      event.preventDefault();
      const target = fileLink(href, base);
      if (target !== null) void openTarget(scena, host, target, 'open');
      else if (/^(https?|mailto):/i.test(href)) window.open(href, '_blank', 'noopener');
      return;
    }
    const code = element.closest('code');
    if (code === null || code.closest('pre') !== null) return;
    const target = codePath(code.textContent ?? '', base);
    if (target !== null) void openTarget(scena, host, target, 'skip');
  };
}
