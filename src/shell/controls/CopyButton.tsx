import { useEffect, useRef, useState, type ReactElement } from 'react';
import { EMOJIcon } from '../../resources/emojis.js';

/** How long the check mark stays after a copy, in milliseconds. */
const SHOWN_MS = 1200;

/** Copy `text` through a selected, hidden text box: the way left to a page served over plain http from another machine, where the browser has no `navigator.clipboard`. */
function copyBySelection(text: string): boolean {
  const box = document.createElement('textarea');
  box.value = text;
  box.setAttribute('readonly', '');
  box.style.position = 'fixed';
  box.style.opacity = '0';
  document.body.appendChild(box);
  box.select();
  try {
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    box.remove();
  }
}

/** An icon that copies `text` to the clipboard, and shows a check mark for a moment once it has. `icon` tells it apart when two copy buttons sit side by side. */
export function CopyButton({ text, label = 'Copy', icon = EMOJIcon.copy }: { text: string; label?: string; icon?: string }): ReactElement {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const done = (): void => {
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), SHOWN_MS);
  };
  const copy = (): void => {
    if (navigator.clipboard === undefined) {
      if (copyBySelection(text)) done();
      return;
    }
    void navigator.clipboard.writeText(text).then(done).catch(() => { if (copyBySelection(text)) done(); });
  };
  const title = copied ? 'Copied' : label;
  return (
    <button type="button" className="web-copy" data-copied={copied ? 'true' : 'false'} title={title} aria-label={title} onClick={copy}>
      {copied ? EMOJIcon.check : icon}
    </button>
  );
}
