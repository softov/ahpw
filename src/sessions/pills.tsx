import type { ReactElement } from 'react';
import { EMOJIcon } from '../emojis.js';

const CARET = EMOJIcon.caretDown;

/** A small rounded control: a fact, or a button that opens a menu when `onOpen` is given. */
export function Pill({ label, title, onOpen, on }: { label: string; title?: string; onOpen?: () => void; on?: boolean }): ReactElement {
  return (
    <button
      type="button"
      className="web-chip"
      data-on={on === true ? 'true' : 'false'}
      title={title}
      disabled={onOpen === undefined}
      onClick={onOpen}
      {...(onOpen === undefined ? {} : { 'aria-haspopup': 'menu' as const })}
    >
      {label}
      {onOpen === undefined ? null : <span aria-hidden="true">{CARET}</span>}
    </button>
  );
}

/** A pill with a text box in it. */
export function TextPill({ label, title, value, placeholder, onChange, width }: {
  label: string;
  title?: string;
  value: string;
  placeholder?: string;
  onChange: (next: string) => void;
  width?: number;
}): ReactElement {
  return (
    <span className="web-chip web-chip--text" title={title ?? label}>
      {label}
      <input aria-label={label} value={value} placeholder={placeholder ?? ''} style={{ width: width ?? 110 }} onChange={(event) => onChange(event.currentTarget.value)} />
    </span>
  );
}
