import type { ReactElement } from 'react';
import './ahpw-mark.css';

/**
 * The ahpw mark: an A standing in a W.
 *
 * The W is three pieces: its two outer strokes, in the bar's colour, and the A
 * between them. The geometry is the 64x64 grid of public/ahpw.svg, which sets
 * it on a dark tile for the favicon, and index.html draws it again for the boot
 * loader; the three copies change together.
 */

/** The W's outer strokes, cut along the A's outer edges. */
export const AHPW_MARK_SIDES = ['M5.38 18 L14.62 18 L20.88 37.34 L16.38 52 Z', 'M58.62 18 L49.38 18 L43.12 37.34 L47.62 52 Z'] as const;

/** The A, from its apex to the W's two bottom points. */
export const AHPW_MARK_A = 'M29.84 8 L34.16 8 L47.62 52 L38.4 52 L32 31.06 L25.6 52 L16.38 52 Z';

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
        <rect x="26" y="43" width="12" height="4.4" fill={AHPW_TEAL_DEEP} />
        {AHPW_MARK_SIDES.map((side) => <path key={side} d={side} fill={AHPW_TEAL_DEEP} />)}
        <path d={AHPW_MARK_A} fill={AHPW_TEAL} />
      </g>
    </svg>
  );
}
