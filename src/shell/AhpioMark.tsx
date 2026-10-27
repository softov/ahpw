import type { ReactElement } from 'react';
import './ahpio-mark.css';

/**
 * The ahpio mark: four dots, green at the top, blue in the middle, yellow and
 * red at the bottom corners.
 *
 * The dots sit on a 64x64 grid, the logo filling it as the desk's icon does.
 * ./ahpio.svg draws the same dots for the favicon, and index.html draws them
 * again for the boot loader; the three copies change together.
 */

/** Each dot, in the order the motion runs: top, middle, bottom left, bottom right. */
export const AHPIO_DOTS = [
  { cx: 31.64, cy: 9.32, fill: '#00A859' },
  { cx: 31.64, cy: 36.68, fill: '#5B9BFF' },
  { cx: 8.6, cy: 54.68, fill: '#FFC82A' },
  { cx: 55.4, cy: 54.68, fill: '#ED3237' },
] as const;

export const AHPIO_DOT_RADIUS = 7.92;

export interface AhpioMarkProps {
  /** Rendered edge in px. */
  size?: number;
  /** Accessible name. Leave it off where the mark only decorates. */
  label?: string;
  /** The dots rise in turn, once, on mount. */
  set?: boolean;
  /** The dots light in turn on a loop, for as long as something loads. */
  pulse?: boolean;
  className?: string;
}

export function AhpioMark({ size = 16, label, set = false, pulse = false, className }: AhpioMarkProps): ReactElement {
  const named = label !== undefined;
  const classes = ['ahpio-mark'];
  if (set) classes.push('ahpio-mark--set');
  if (pulse) classes.push('ahpio-mark--pulse');
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
      {AHPIO_DOTS.map((dot) => (
        <circle key={dot.fill} className="ahpio-mark__dot" cx={dot.cx} cy={dot.cy} r={AHPIO_DOT_RADIUS} fill={dot.fill} />
      ))}
    </svg>
  );
}
