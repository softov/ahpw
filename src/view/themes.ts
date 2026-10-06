import { registerTheme } from '@softov/scena/styles';
import solarizedHref from './themes/solarized.css?url';
import paperHref from './themes/paper.css?url';
import coderHref from './themes/coder.css?url';
import vsModernHref from './themes/vs-modern.css?url';
import { sunsetTheme } from './themes/sunset.js';

/** One CSS file that styles both modes of a theme. */
const both = (href: string) => ({ light: { kind: 'css' as const, href }, dark: { kind: 'css' as const, href } });

/** The themes offered beside scena's own default. */
export function registerThemes(): void {
  registerTheme({ id: 'vs-modern', label: 'VS Modern', variants: both(vsModernHref) });
  registerTheme({ id: 'solarized', label: 'Solarized', variants: both(solarizedHref) });
  registerTheme({ id: 'paper', label: 'Paper', variants: both(paperHref) });
  registerTheme({ id: 'coder', label: 'Coder', variants: both(coderHref) });
  registerTheme(sunsetTheme);
}
