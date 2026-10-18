import type { ReactElement } from 'react';
import './ahpw-mark.css';

/**
 * The ahpw mark: an A standing in a W.
 *
 * The W is its two outer strokes, in the bar's colour, with the A drawn over
 * them. The geometry is the 64x64 grid of ./ahpw.svg, which sets
 * it on a dark tile for the favicon, and index.html draws it again for the boot
 * loader; the three copies change together.
 */

/** The W's outer strokes, which the A's legs cover at the bottom. */
export const AHPW_MARK_SIDES = ['M7 11.25 L18.84 11.25 L23.85 56.88 L12.01 56.88 Z', 'M57 11.25 L45.16 11.25 L40.15 56.88 L51.99 56.88 Z'] as const;

/** The A, from its apex to the W's two bottom points. */
export const AHPW_MARK_A = 'M29.29 7.08 L34.83 7.08 L52.12 56.84 L40.28 56.84 L32.06 33.15 L23.85 56.84 L12.01 56.84 Z';

/** The A's colour, the same on every theme. */
export const AHPW_TEAL = '#62c9b0';

/** The bar's and the outer strokes' colour. */
export const AHPW_TEAL_DEEP = '#356b5e';

export interface AhpwMarkProps {
  /** Rendered edge in px. */
  size?: number;
  /** Accessible name. Leave it off where "ahpw" is already written beside it. */
  label?: string;
  /** Rise off the baseline once, on mount. */
  set?: boolean;
  /** Echoes of the A leave the mark on a loop, for as long as something loads. */
  echo?: boolean;
  className?: string;
}

export function AhpwMark({ size = 16, label, set = false, echo = false, className }: AhpwMarkProps): ReactElement {
  const named = label !== undefined;
  const classes = ['ahpw-mark'];
  if (set) classes.push('ahpw-mark--set');
  if (className !== undefined) classes.push(className);
  return (
    <svg
      className={classes.join(' ')}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role={named ? 'img' : undefined}
      aria-hidden={named ? undefined : true}
      focusable="false"
      style={{ display: 'block', flex: 'none', overflow: 'visible' }}
    >
      {named ? <title>{label}</title> : null}
      {echo ? ['', ' ahpw-mark__echo--second', ' ahpw-mark__echo--third'].map((more) => (
        <path key={more} className={`ahpw-mark__echo${more}`} d={AHPW_MARK_A} fill={AHPW_TEAL} />
      )) : null}
      <g className="ahpw-mark__art">
        <rect x="23.56" y="42.23" width="17.1" height="7.92" fill={AHPW_TEAL_DEEP} />
        {AHPW_MARK_SIDES.map((side) => <path key={side} d={side} fill={AHPW_TEAL_DEEP} />)}
        <path d={AHPW_MARK_A} fill={AHPW_TEAL} />
      </g>
    </svg>
  );
}
