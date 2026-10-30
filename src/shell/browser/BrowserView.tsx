import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type MouseEvent, type ReactElement } from 'react';
import { useI18n } from '@softov/scena/react';
import { ContextMenu } from '@softov/scena/ui';
import type { PickerAction } from '@softov/scena/types';
import { EMOJIcon } from '../../resources/emojis.js';
import { copyText } from '../controls/CopyButton.js';
import { embedder, type EmbedBounds, type EmbedNavigation } from '../embed/index.js';
import { addressOf } from './address.js';
import { back, canBack, canForward, current, follow, forward, go, NO_VISITS, visit, type Visits } from './history.js';

/** Where the last address is kept, so the view opens on it the next time. */
const LAST_KEY = 'ahpw.browser.last';

/** What the iframe may do: run its scripts, send forms, open pop-ups and keep its own origin, but not move ahpw's page. */
const SANDBOX = 'allow-scripts allow-forms allow-popups allow-same-origin';

/** How long the share button shows a check mark after a copy, in milliseconds. */
const COPIED_MS = 1200;

function readLast(): string | null {
  try {
    return addressOf(localStorage.getItem(LAST_KEY) ?? '');
  } catch {
    return null;
  }
}

function keepLast(url: string): void {
  try {
    localStorage.setItem(LAST_KEY, url);
  } catch {
    // Not kept; the next visit starts empty.
  }
}

const sameBounds = (a: EmbedBounds | null, b: EmbedBounds): boolean =>
  a !== null && a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;

/**
 * Keeps the embedder's browser over `box` while the box shows: sends its
 * bounds each time they change, and hides the browser when the box has no
 * size, as in a hidden tab, or goes.
 */
function useEmbedBounds(box: React.RefObject<HTMLDivElement | null>): void {
  const browser = embedder?.browser;
  useEffect(() => {
    if (browser === undefined) return undefined;
    let sent: EmbedBounds | null = null;
    let frame = 0;
    const place = (): void => {
      const rect = box.current?.getBoundingClientRect();
      const bounds = rect === undefined ? null : { x: Math.round(rect.left), y: Math.round(rect.top), width: Math.round(rect.width), height: Math.round(rect.height) };
      if (bounds === null || bounds.width === 0 || bounds.height === 0) {
        if (sent !== null) browser.hide();
        sent = null;
      } else if (!sameBounds(sent, bounds)) {
        browser.show(bounds);
        sent = bounds;
      }
      frame = requestAnimationFrame(place);
    };
    frame = requestAnimationFrame(place);
    return () => {
      cancelAnimationFrame(frame);
      browser.hide();
    };
  }, [browser, box]);
}

/**
 * The Browser view: a toolbar and a web page. On the web the page is an
 * iframe, and back and forward cover the addresses opened from the toolbar.
 * With an embedder's browser, that browser draws the page over the view.
 */
export default function BrowserView(): ReactElement {
  const { t } = useI18n();
  const browser = embedder?.browser;
  const [visits, setVisits] = useState<Visits>(() => {
    const last = readLast();
    return last === null ? NO_VISITS : visit(NO_VISITS, last);
  });
  const shown = current(visits);
  const [typed, setTyped] = useState(shown ?? '');
  const [refused, setRefused] = useState(false);
  // A new value loads the iframe again: a page from another origin cannot be told to reload.
  const [loads, setLoads] = useState(0);
  const [navigation, setNavigation] = useState<EmbedNavigation | null>(null);
  const [copied, setCopied] = useState(false);
  const [menu, setMenu] = useState<{ x: number; y: number; items: PickerAction[] } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const copiedTimer = useRef<number | undefined>(undefined);

  useEmbedBounds(box);

  useEffect(() => {
    setTyped(shown ?? '');
    if (shown !== undefined) keepLast(shown);
  }, [shown]);

  useEffect(() => {
    if (browser === undefined) return undefined;
    const first = current(visits);
    if (first !== undefined) browser.open(first);
    return browser.onNavigated((reached) => {
      setNavigation(reached);
      setVisits((now) => follow(now, reached.url));
    });
    // The embedder opens the kept address once; later opens come from the toolbar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [browser]);

  useEffect(() => () => window.clearTimeout(copiedTimer.current), []);

  const open = (url: string): void => {
    setRefused(false);
    setVisits((now) => visit(now, url));
    browser?.open(url);
  };

  const submit = (event: FormEvent): void => {
    event.preventDefault();
    const url = addressOf(typed);
    if (url === null) {
      setRefused(typed.trim() !== '');
      return;
    }
    if (url === shown) reload();
    else open(url);
  };

  const escape = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key !== 'Escape') return;
    setTyped(shown ?? '');
    setRefused(false);
  };

  const goBack = (): void => {
    if (browser === undefined) setVisits(back);
    else browser.back();
  };

  const goForward = (): void => {
    if (browser === undefined) setVisits(forward);
    else browser.forward();
  };

  const reload = (): void => {
    if (browser === undefined) setLoads((n) => n + 1);
    else browser.reload();
  };

  const goTo = (index: number): void => {
    const url = visits.entries[index];
    if (url === undefined) return;
    if (browser === undefined) setVisits((now) => go(now, index));
    else open(url);
  };

  const share = (): void => {
    if (shown === undefined) return;
    if (typeof navigator.share === 'function') {
      // A closed share sheet rejects; there is nothing to say.
      navigator.share({ url: shown }).catch(() => undefined);
      return;
    }
    void copyText(shown).then((done) => {
      if (!done) return;
      setCopied(true);
      window.clearTimeout(copiedTimer.current);
      copiedTimer.current = window.setTimeout(() => setCopied(false), COPIED_MS);
    });
  };

  const openHistory = (event: MouseEvent<HTMLButtonElement>): void => {
    const rect = event.currentTarget.getBoundingClientRect();
    const items: PickerAction[] = visits.entries
      .map((url, index) => ({
        title: url,
        icon: index === visits.at ? EMOJIcon.check : '',
        onSelect: (host: { closeMenu: () => void }) => { host.closeMenu(); goTo(index); },
      }))
      .reverse();
    setMenu({ x: Math.max(0, rect.right - 260), y: rect.bottom, items });
  };

  const backable = browser === undefined ? canBack(visits) : navigation?.canGoBack ?? false;
  const forwardable = browser === undefined ? canForward(visits) : navigation?.canGoForward ?? false;
  const shareLabel = copied ? t('shell/browser/copied') : t('shell/browser/share');

  const button = (icon: string, label: string, run: (event: MouseEvent<HTMLButtonElement>) => void, disabled = false): ReactElement => (
    <button type="button" className="web-explorer__action" title={label} aria-label={label} disabled={disabled} onClick={run}>
      <span className="web-explorer__icon">{icon}</span>
    </button>
  );

  return (
    <div className="web-browser">
      <div className="web-browser__bar">
        <span className="web-explorer__actions">
          {button(EMOJIcon.back, t('shell/browser/back'), goBack, !backable)}
          {button(EMOJIcon.forward, t('shell/browser/forward'), goForward, !forwardable)}
          {button(EMOJIcon.reload, t('common/reload'), reload, shown === undefined)}
        </span>
        <form className="web-browser__address" onSubmit={submit}>
          <input
            type="text"
            inputMode="url"
            enterKeyHint="go"
            spellCheck={false}
            autoComplete="off"
            value={typed}
            placeholder={t('shell/browser/addressHint')}
            aria-label={t('shell/browser/address')}
            aria-invalid={refused}
            onChange={(event) => { setTyped(event.target.value); setRefused(false); }}
            onKeyDown={escape}
            onFocus={(event) => event.currentTarget.select()}
          />
        </form>
        <span className="web-explorer__actions">
          {button(EMOJIcon.period, t('shell/browser/history'), openHistory, visits.entries.length === 0)}
          {button(copied ? EMOJIcon.check : EMOJIcon.share, shareLabel, share, shown === undefined)}
          {shown === undefined ? (
            button(EMOJIcon.external, t('shell/browser/openOutside'), () => undefined, true)
          ) : (
            <a className="web-explorer__action" href={shown} target="_blank" rel="noopener noreferrer" title={t('shell/browser/openOutside')} aria-label={t('shell/browser/openOutside')}>
              <span className="web-explorer__icon">{EMOJIcon.external}</span>
            </a>
          )}
        </span>
      </div>
      {refused ? <p className="web-note web-browser__refused" role="alert">{t('shell/browser/refused')}</p> : null}
      <div className="web-browser__page" ref={box}>
        {shown === undefined ? (
          <div className="web-browser__empty">
            <p className="web-browser__emptyTitle">{t('shell/browser/empty')}</p>
            <p className="web-note">{t('shell/browser/emptyBody')}</p>
          </div>
        ) : browser === undefined ? (
          <iframe key={`${loads}:${shown}`} className="web-browser__frame" src={shown} title={shown} sandbox={SANDBOX} referrerPolicy="strict-origin-when-cross-origin" />
        ) : null}
      </div>
      {menu === null ? null : <ContextMenu spec={{ items: menu.items }} x={menu.x} y={menu.y} onClose={() => setMenu(null)} />}
    </div>
  );
}
