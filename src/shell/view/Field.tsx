import type { ReactElement, ReactNode } from 'react';

/** A form field: its label, the control, and a hint under it. */
export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }): ReactElement {
  return (
    <label className="web-form__field">
      <span className="web-input__label">{label}</span>
      {children}
      {hint === undefined ? null : <span className="web-input__hint">{hint}</span>}
    </label>
  );
}
