import type { ReactElement } from 'react';

const CARET = '\u{25BE}';

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

/** A pill over a native select: it reads as a chip and picks like a menu. */
export function ChoicePill({ label, title, value, options, onChange }: {
  label: string;
  title?: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (next: string) => void;
}): ReactElement {
  const shown = options.find((one) => one.value === value)?.label ?? value;
  return (
    <span className="web-chip web-chip--choice" title={title ?? label}>
      {`${label}: ${shown === '' ? 'default' : shown}`}
      <span aria-hidden="true">{CARET}</span>
      <select aria-label={label} value={value} onChange={(event) => onChange(event.currentTarget.value)}>
        {options.map((one) => <option key={one.value} value={one.value}>{one.label}</option>)}
      </select>
    </span>
  );
}

/** A pill that is a switch. */
export function TogglePill({ label, title, value, onChange }: { label: string; title?: string; value: boolean; onChange: (next: boolean) => void }): ReactElement {
  return (
    <button type="button" className="web-chip" data-on={value ? 'true' : 'false'} aria-pressed={value} title={title ?? label} onClick={() => onChange(!value)}>
      {label}
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
