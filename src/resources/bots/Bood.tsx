import { useEffect, useLayoutEffect, useMemo, useRef, type ReactElement } from 'react';
import { useStore } from '@softov/scena/react';
import { resolveThemeMode, THEME_MODE_PATH, type ThemeModeChoice } from '@softov/scena/styles';
import { ambient, blink, scene, type BoodMood, type BoodScene } from '@cofold/bood';
import { mountBood, type BoodView } from '@cofold/bood/dom';
import { boodBody, colorOf } from './look.js';

/** A bot as bood draws it: ahpd's body and colour, with every bot's face, dot eyes and no brows or mouth. */
export function botScene(body: string, color: string | undefined, mood: BoodMood, scheme: 'dark' | 'light', width: number): BoodScene {
  return scene(boodBody(body), {
    mood,
    scheme,
    color: colorOf(color),
    filled: true,
    eyes: 'dots',
    brows: false,
    mouth: false,
    detail: width < 60 ? 'simple' : 'full',
  });
}

/**
 * A bot, drawn `width` pixels wide. It breathes and blinks unless `still`,
 * and follows its props without being drawn again.
 */
export function Bood({ body, color, mood = 'idle', width, still = false }: {
  body: string;
  color?: string;
  mood?: BoodMood;
  width: number;
  still?: boolean;
}): ReactElement {
  const box = useRef<HTMLDivElement>(null);
  const view = useRef<BoodView | null>(null);
  const scheme = resolveThemeMode(useStore<ThemeModeChoice>(THEME_MODE_PATH) ?? 'system');
  const drawn = useMemo(() => botScene(body, color, mood, scheme, width), [body, color, mood, scheme, width]);

  useLayoutEffect(() => {
    view.current = mountBood(box.current!, drawn);
    return () => {
      view.current?.destroy();
      view.current = null;
    };
    // Drawn once; later scenes go through setScene below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    view.current?.setScene(drawn);
  }, [drawn]);

  // Breath and the other moves of its mood, and a blink every few seconds.
  useEffect(() => {
    const shown = view.current;
    if (still || shown === null) return;
    const kind = boodBody(body);
    const moves = ambient(kind, mood, { scheme, brows: false });
    moves.forEach((move, at) => shown.play(move, { key: `ambient:${at}` }));
    let timer = 0;
    const next = (): void => {
      timer = window.setTimeout(() => {
        shown.play(blink(kind), { key: 'blink' });
        next();
      }, 3400 + Math.random() * 4200);
    };
    next();
    return () => {
      window.clearTimeout(timer);
      moves.forEach((_, at) => shown.stop(`ambient:${at}`));
      shown.stop('blink');
    };
  }, [body, mood, scheme, still]);

  return <div ref={box} className="web-bood" style={{ width }} aria-hidden="true" />;
}
