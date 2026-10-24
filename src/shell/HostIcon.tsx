import { useSyncExternalStore, type ReactElement, type ReactNode } from 'react';
import { useStore } from '@softov/scena/react';
import { Text } from '@softov/scena/ui';
import { resolveThemeMode, THEME_MODE_PATH, type ThemeModeChoice } from '@softov/scena/styles';
import { pickIcon, type Icon } from '../bridges/icons.js';

/** The system's dark preference; the theme controller follows it on the document, not in the store. */
const DARK = '(prefers-color-scheme: dark)';
const followSystem = (changed: () => void): (() => void) => {
  if (typeof window === 'undefined' || !window.matchMedia) return () => undefined;
  const query = window.matchMedia(DARK);
  query.addEventListener('change', changed);
  return () => query.removeEventListener('change', changed);
};
const systemDark = (): boolean => typeof window !== 'undefined' && window.matchMedia !== undefined && window.matchMedia(DARK).matches;

/** The scheme shown: the chosen mode, or the system's while the choice is `system`. */
export function useScheme(): 'light' | 'dark' {
  const choice = useStore<ThemeModeChoice>(THEME_MODE_PATH) ?? 'system';
  const dark = useSyncExternalStore(followSystem, systemDark, () => false);
  return choice === 'system' ? (dark ? 'dark' : 'light') : resolveThemeMode(choice);
}

/** The host's icon to draw for the scheme shown, or nothing. */
export function useHostIcon(icons: readonly Icon[] | undefined): Icon | undefined {
  return pickIcon(icons, useScheme());
}

/**
 * A host's icon for the scheme shown, as an image and never as markup: the
 * host does not clean an SVG, and an image runs no script. With no icon to
 * draw, the fallback stands in its place.
 */
export function HostIcon({ icons, size, fallback = null, className }: {
  icons: readonly Icon[] | undefined;
  /** The width and height in CSS pixels. */
  size: number;
  fallback?: ReactNode;
  className?: string;
}): ReactElement | null {
  const icon = useHostIcon(icons);
  if (icon === undefined) return fallback === null ? null : <>{fallback}</>;
  return (
    <img
      className={className === undefined ? 'web-host-icon' : `web-host-icon ${className}`}
      src={icon.src}
      width={size}
      height={size}
      alt=""
      draggable={false}
    />
  );
}

/** A page's heading: the host's icon before the title, or the kind's emoji in the text when there is none. */
export function HostTitle({ icons, emoji, title }: { icons: readonly Icon[] | undefined; emoji: string; title: string }): ReactElement {
  const icon = useHostIcon(icons);
  if (icon === undefined) return <Text variant="h2" text={`${emoji} ${title}`} />;
  return (
    <span className="web-host-title">
      <img className="web-host-icon" src={icon.src} width={24} height={24} alt="" draggable={false} />
      <Text variant="h2" text={title} />
    </span>
  );
}
