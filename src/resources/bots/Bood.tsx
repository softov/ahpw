import { useEffect, useLayoutEffect, useMemo, useRef, type ReactElement } from 'react';
import { useStore } from '@softov/scena/react';
import { resolveThemeMode, THEME_MODE_PATH, type ThemeModeChoice } from '@softov/scena/styles';
import {
  action, actionsOf, ambient, blink, creatures, ease, glance, pop, pose, randomTransit, scene, swing, transit,
  type BoodMood, type BoodPose, type BoodScene, type BoodTransit,
} from '@cofold/bood';
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

/** As ahpapp: how long a body's measured place is trusted, and the waits of its life, in ms. */
const MEASURE_MS = 500;
const FOLLOW_MS = [5500, 9500] as const;
const WANDER_EVERY_MS = [20_000, 120_000] as const;
const WANDER_FOR_MS = [2000, 6000] as const;
/** How often a wander is a tilt of the head instead of a look, and how far it tilts, as a share of bood's most. */
const TILT_SHARE = 0.4;
const TILT_REACH = [0.4, 1] as const;
const ACT_EVERY_MS = [300_000, 900_000] as const;
const TRANSIT_GAP_MS = 400;

type Point = { x: number; y: number } | null;

// The pointer on the page, shared by every moving bot: one listener, however many bodies follow it.
const watchers = new Set<(point: Point) => void>();
const moved = (event: PointerEvent): void => watchers.forEach((fn) => fn({ x: event.clientX, y: event.clientY }));
const left = (): void => watchers.forEach((fn) => fn(null));
function watchPointer(fn: (point: Point) => void): () => void {
  if (watchers.size === 0) {
    document.addEventListener('pointermove', moved, { passive: true });
    document.documentElement.addEventListener('pointerleave', left);
  }
  watchers.add(fn);
  return () => {
    watchers.delete(fn);
    if (watchers.size > 0) return;
    document.removeEventListener('pointermove', moved);
    document.documentElement.removeEventListener('pointerleave', left);
  };
}

const between = (min: number, max: number): number => min + Math.random() * (max - min);
const clamp = (value: number): number => Math.max(-1, Math.min(1, value));

/**
 * A bot, drawn `width` pixels wide, and follows its props without being drawn
 * again. Unless `still` it breathes and blinks, glances about, turns its head
 * to the pointer, now and then stares off somewhere, and when idle plays one
 * of its moves every few minutes. A new `arrive.at` shows it with `arrive.transit`,
 * as a bot that just teleported to where it is drawn.
 */
export function Bood({ body, color, mood = 'idle', width, still = false, arrive }: {
  body: string;
  color?: string | undefined;
  mood?: BoodMood;
  width: number;
  still?: boolean;
  arrive?: { transit: BoodTransit; at: number } | undefined;
}): ReactElement {
  const box = useRef<HTMLDivElement>(null);
  const view = useRef<BoodView | null>(null);
  const scheme = resolveThemeMode(useStore<ThemeModeChoice>(THEME_MODE_PATH) ?? 'system');
  const drawn = useMemo(() => botScene(body, color, mood, scheme, width), [body, color, mood, scheme, width]);
  // Read by a move when it starts, so a colour change does not restart the body's life.
  const paint = useRef(colorOf(color));
  paint.current = colorOf(color);

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

  // Before paint, so an arriving body is not seen before its show starts from hidden.
  useLayoutEffect(() => {
    if (arrive === undefined || still) return;
    view.current?.play(transit(arrive.transit, 'show', { color: paint.current }), { key: 'act' });
    // It plays on a new `at` only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrive?.at]);

  // A small pop when the mood changes, not when the body first shows.
  const shownMood = useRef(mood);
  useEffect(() => {
    if (shownMood.current === mood) return;
    shownMood.current = mood;
    if (!still) view.current?.play(pop());
  }, [mood, still]);

  useEffect(() => {
    const shown = view.current;
    const held = box.current;
    if (still || shown === null || held === null) return;
    const kind = boodBody(body);
    const moves = ambient(kind, mood, { scheme, brows: false });
    moves.forEach((move, at) => shown.play(move, { key: `ambient:${at}` }));

    // A move's end can land after the body is gone; nothing is scheduled then.
    let live = true;
    const timers = new Set<number>();
    const later = (ms: number, fn: () => void): void => {
      if (!live) return;
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        fn();
      }, ms);
      timers.add(timer);
    };
    const every = (min: number, max: number, fn: () => void): void => {
      const tick = (): void => {
        fn();
        later(between(min, max), tick);
      };
      later(between(min, max), tick);
    };
    every(3400, 7600, () => shown.play(blink(kind), { key: 'blink' }));
    // The rest moves the eyes and head about, which a person who asked for less motion does not get.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return () => {
        live = false;
        timers.forEach((timer) => window.clearTimeout(timer));
        moves.forEach((_, at) => shown.stop(`ambient:${at}`));
        shown.stop('blink');
      };
    }

    // The head's move under way, so the next starts from where the face is now, not from where the last was headed.
    let posing = { from: { facing: 0, lift: 0 } as BoodPose, to: { facing: 0, lift: 0 } as BoodPose, start: 0, ms: 0 };
    let gaze = { x: 0, y: 0 };
    let following = false;
    let wandering = false;
    let acting = false;
    let latest: Point = null;
    let frame = 0;
    let rest = 0;
    let place: DOMRect | null = null;
    let measuredAt = 0;

    const poseNow = (): BoodPose => {
      const { from, to, start, ms } = posing;
      const done = ms === 0 ? 1 : ease('ease-out', Math.min(1, (performance.now() - start) / ms));
      const mix = (a = 0, b = 0): number => a + (b - a) * done;
      return { facing: mix(from.facing, to.facing), lift: mix(from.lift, to.lift), tilt: mix(from.tilt, to.tilt) };
    };
    const face = (next: BoodPose, ms: number): void => {
      const from = poseNow();
      shown.play(pose(kind, mood, next, from, ms), { key: 'pose' });
      posing = { from, to: next, start: performance.now(), ms };
    };
    const look = (x: number, y: number): void => {
      shown.play(glance(kind, mood, x, y, gaze), { key: 'glance' });
      gaze = { x, y };
    };
    const follow = (): void => {
      if (frame !== 0) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (latest === null || wandering) return;
        const now = Date.now();
        if (place === null || now - measuredAt > MEASURE_MS) {
          place = held.getBoundingClientRect();
          measuredAt = now;
        }
        // A body in a hidden tab has no size, and nothing to turn.
        if (place.width === 0 || place.height === 0) return;
        if (!following && (gaze.x !== 0 || gaze.y !== 0)) look(0, 0);
        following = true;
        face({
          facing: clamp((latest.x - (place.left + place.width / 2)) / (place.width / 2)),
          lift: clamp(-(latest.y - (place.top + place.height / 2)) / (place.height / 2)),
        }, 200);
      });
    };
    /** Back to the pointer if it is still followed, or to looking ahead. */
    const resume = (): void => {
      if (latest !== null) follow();
      else face({ facing: 0, lift: 0 }, 400);
    };
    const stopFollowing = (): void => {
      window.clearTimeout(rest);
      latest = null;
      following = false;
      if (!wandering) resume();
    };
    const unwatch = watchPointer((point) => {
      if (point === null) {
        stopFollowing();
        return;
      }
      latest = point;
      window.clearTimeout(rest);
      rest = window.setTimeout(stopFollowing, between(...FOLLOW_MS));
      follow();
    });

    every(900, 3300, () => {
      if (!following && !wandering) look(between(-0.4, 0.4), between(-0.4, 0.4));
    });
    if (creatures[kind].antenna !== undefined) every(3200, 7400, () => shown.play(swing(kind), { key: 'swing' }));

    if (mood === 'idle') {
      // Now and then it stares off somewhere for a few seconds, or tilts its head to one side, then looks back.
      const wander = (): void => {
        if (!acting) {
          wandering = true;
          if (Math.random() < TILT_SHARE) {
            face({ facing: 0, lift: 0, tilt: (Math.random() < 0.5 ? -1 : 1) * between(...TILT_REACH) }, 500);
          } else {
            const angle = Math.random() * Math.PI * 2;
            look(Math.cos(angle), Math.sin(angle));
            face({ facing: Math.cos(angle), lift: -Math.sin(angle) }, 400);
          }
          later(between(...WANDER_FOR_MS), () => {
            wandering = false;
            look(0, 0);
            resume();
          });
        }
        later(between(...WANDER_EVERY_MS), wander);
      };
      later(between(...WANDER_EVERY_MS), wander);

      // And every few minutes it plays one of its moves, or leaves and comes back.
      const actions = actionsOf(kind);
      every(...ACT_EVERY_MS, () => {
        if (acting || wandering) return;
        acting = true;
        const pick = Math.floor(Math.random() * (actions.length + 1));
        const done = (): void => { acting = false; };
        if (pick < actions.length) {
          void shown.play(action(kind, actions[pick]!, { color: paint.current, filled: true }), { key: 'act' }).finished.then(done, done);
          return;
        }
        void shown.play(transit(randomTransit(), 'hide', { color: paint.current }), { key: 'act' }).finished.then(() => {
          later(TRANSIT_GAP_MS, () => {
            void shown.play(transit(randomTransit(), 'show', { color: paint.current }), { key: 'act' }).finished.then(done, done);
          });
        }, done);
      });
    }

    return () => {
      live = false;
      timers.forEach((timer) => window.clearTimeout(timer));
      window.clearTimeout(rest);
      cancelAnimationFrame(frame);
      unwatch();
      moves.forEach((_, at) => shown.stop(`ambient:${at}`));
      for (const key of ['blink', 'pose', 'glance', 'swing', 'act']) shown.stop(key);
    };
  }, [body, mood, scheme, still]);

  return <div ref={box} className="web-bood" style={{ width }} aria-hidden="true" />;
}
