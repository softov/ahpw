import type { ReactElement } from 'react';

interface RemovableChipProps {
  label: string;
  /** The pill's tooltip; its label when not given. */
  title?: string;
  /** Drawn with the accent fill, as a held chip is. */
  on?: boolean;
  /** The ✕'s name, for a screen reader and its tooltip. */
  removeLabel: string;
  /** Called by the ✕; without it the pill has no ✕. */
  onRemove?: () => void;
}

/**
 * A pill with a ✕ that removes what it names, as a role on a user or a
 * membership on a team. scena's `Chip` is a toggle and holds nothing else, so
 * this is ahpw's until it is validated and moves to scena.
 */
export function RemovableChip({ label, title, on = false, removeLabel, onRemove }: RemovableChipProps): ReactElement {
  return (
    <span className="web-chip" data-on={on ? 'true' : undefined} data-still={onRemove === undefined ? 'true' : undefined} title={title ?? label}>
      {label}
      {onRemove === undefined ? null : (
        <button type="button" className="web-chip__remove" aria-label={removeLabel} title={removeLabel} onClick={onRemove}>{'\u{00D7}'}</button>
      )}
    </span>
  );
}
