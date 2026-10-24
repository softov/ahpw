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

/**
 * A page's heading: the host's icon, or the kind's emoji, beside two lines -
 * the title, and under it the page's URI and its state.
 */
export function PageTitle({ icons, emoji, title, onTitle, titleHint, uri, uriHint, state }: {
  icons?: readonly Icon[] | undefined;
  emoji: string;
  title: string;
  /** Opens what the title names; the title is then a button. */
  onTitle?: () => void;
  titleHint?: string;
  uri?: string | undefined;
  uriHint?: string;
  /** The state badge after the URI. */
  state?: ReactNode;
}): ReactElement {
  const icon = useHostIcon(icons);
  const heading = <Text variant="h2" text={title} />;
  return (
    <div className="web-page-title">
      {icon === undefined
        ? <span className="web-page-title__mark" aria-hidden="true">{emoji}</span>
        : <img className="web-host-icon web-page-title__mark" src={icon.src} width={40} height={40} alt="" draggable={false} />}
      <div className="web-page-title__lines">
        {onTitle === undefined ? heading : (
          <button type="button" className="web-page-title__open" {...(titleHint === undefined ? {} : { title: titleHint })} onClick={onTitle}>{heading}</button>
        )}
        {uri === undefined && state === undefined ? null : (
          <div className="web-page-title__meta">
            {uri === undefined ? null : <span className="web-role__uri" {...(uriHint === undefined ? {} : { title: uriHint })}>{uri}</span>}
            {state}
          </div>
        )}
      </div>
    </div>
  );
}
