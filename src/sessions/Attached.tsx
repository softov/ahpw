import type { ReactElement } from 'react';
import type { MessageAttachment } from '@microsoft/agent-host-protocol';
import { attachmentIcon, attachmentLabel, attachmentPath } from './attachments.js';
import { EMOJIcon } from '../emojis.js';

/** What goes with the message, above its text, each with a way to take it off. Nothing when there is none. */
export function Attached({ attachments, folder, onRemove }: {
  attachments: readonly MessageAttachment[];
  folder: string | undefined;
  onRemove: (index: number) => void;
}): ReactElement | null {
  if (attachments.length === 0) return null;
  return (
    <div className="web-composer__attached">
      {attachments.map((one, index) => (
        <span key={`${attachmentLabel(one)}-${index}`} className="web-attachment" title={attachmentPath(one, folder) ?? attachmentLabel(one)}>
          <span className="web-attachment__icon" aria-hidden="true">{attachmentIcon(one)}</span>
          <span className="web-attachment__label">{attachmentLabel(one)}</span>
          <button type="button" className="web-attachment__remove" aria-label={`Remove ${attachmentLabel(one)}`} onClick={() => onRemove(index)}>
            {EMOJIcon.close}
          </button>
        </span>
      ))}
    </div>
  );
}

/** The composer's `+`, which opens Add context. Drawn, not typed, so it sits in the middle of its square in any font. */
export function AddButton({ onClick }: { onClick: () => void }): ReactElement {
  return (
    <button type="button" className="web-composer__add" aria-label="Add context" title="Add context" onClick={onClick}>
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
        <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </button>
  );
}
