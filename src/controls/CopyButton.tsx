import { useEffect, useRef, useState, type ReactElement } from 'react';
import { EMOJIcon } from '../emojis.js';

/** How long the check mark stays after a copy, in milliseconds. */
const SHOWN_MS = 1200;

/** An icon that copies `text` to the clipboard, and shows a check mark for a moment once it has. `caption` is a word after the icon, for when two copy buttons sit side by side. */
export function CopyButton({ text, label = 'Copy', caption }: { text: string; label?: string; caption?: string }): ReactElement {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const copy = (): void => {
    void navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), SHOWN_MS);
    }).catch(() => undefined);
  };
  const title = copied ? 'Copied' : label;
  return (
    <button type="button" className="web-copy" data-copied={copied ? 'true' : 'false'} title={title} aria-label={title} onClick={copy}>
      {copied ? EMOJIcon.check : EMOJIcon.copy}
      {caption === undefined ? null : <span className="web-copy__caption">{caption}</span>}
    </button>
  );
}
