import { useMemo, useRef, useState, type CSSProperties, type PointerEvent, type ReactElement } from 'react';
import { useI18n } from '@softov/scena/react';
import { ContextMenu } from '@softov/scena/ui';
import { useChannelOnEach } from '../../../bridges/channel.js';
import { refKey, refOf, useShownHosts } from '../../../bridges/hosts.js';
import { useServingHosts } from '../../../bridges/served.js';
import { Bood } from '../Bood.js';
import { BOTS, BOTS_SCHEME, botsReducer, type BotRecord, type BotsState } from '../catalogue.js';
import { BotPopover } from './BotPopover.js';
import { fillPucks, joinPuck, readPucks, snapPuck, splitCluster, takeOut, writePucks, type Edge, type Puck } from './pucks.js';

/** How wide a floating bot is drawn. */
const WIDTH = 48;
/** How far the pointer moves before a press is a drag, not a click. */
const DRAG_PX = 6;
/** How long a press is held before a drag takes the whole puck. */
const HOLD_MS = 300;

interface Opened {
  key: string;
  x: number;
  y: number;
}

/** A press on a bot, and the drag it may become. */
interface Press {
  key: string;
  puck: Puck;
  x: number;
  y: number;
  at: number;
  /** The bots it moves, once it is a drag: the whole puck when held, or when the puck holds one. */
  bots?: string[];
}

/** The popover's size, as its CSS draws it, so it opens clear of the puck it came from. */
const POPOVER = { width: 320, height: 132 };

/** Where a popover opens: off the puck's edge, toward the middle of the window. */
function besideOf(box: DOMRect, edge: Edge): { x: number; y: number } {
  switch (edge) {
    case 'right':
      return { x: box.left - POPOVER.width - 8, y: box.top };
    case 'left':
      return { x: box.right + 8, y: box.top };
    case 'bottom':
      return { x: box.left, y: box.top - POPOVER.height - 8 };
    case 'top':
      return { x: box.left, y: box.bottom + 8 };
  }
}

/**
 * The shown hosts' bots, floating in pucks at the window's edges: a few drawn
 * in each, a count of the rest. Hovering one makes it look up; opening one
 * makes it glad, and lets a person talk to it. A bot dragged out rests on the
 * nearest edge, or joins the puck it is dropped on; held first, the whole puck
 * moves. Where they rest is kept in this browser.
 */
export default function BotLayer(): ReactElement | null {
  const { t } = useI18n();
  const hosts = useServingHosts(useShownHosts(), BOTS_SCHEME);
  const { states } = useChannelOnEach<BotsState>(hosts, BOTS, botsReducer);
  const [pucks, setPucks] = useState<Puck[]>(readPucks);
  const [hovered, setHovered] = useState<string | null>(null);
  const [opened, setOpened] = useState<Opened | null>(null);
  const [overflow, setOverflow] = useState<{ x: number; y: number; bots: string[] } | null>(null);
  const [drag, setDrag] = useState<{ bots: string[]; x: number; y: number; target: string | null } | null>(null);
  const press = useRef<Press | null>(null);
  const puckBoxes = useRef(new Map<string, HTMLDivElement>());

  const bots = useMemo(() => {
    const all = new Map<string, BotRecord>();
    hosts.forEach((host, at) => {
      for (const bot of states[at]?.bots ?? []) all.set(refKey(host, bot.id), bot);
    });
    return all;
  }, [hosts, states]);
  const laid = useMemo(() => fillPucks([...bots.keys()], pucks), [bots, pucks]);

  /** The puck under a point, other than the one being dragged whole. */
  const puckAt = (x: number, y: number, moving: readonly string[]): string | null => {
    for (const puck of laid) {
      if (puck.bots.every((bot) => moving.includes(bot))) continue;
      const box = puckBoxes.current.get(puck.id)?.getBoundingClientRect();
      if (box !== undefined && x >= box.left - 8 && x <= box.right + 8 && y >= box.top - 8 && y <= box.bottom + 8) return puck.id;
    }
    return null;
  };

  const down = (event: PointerEvent<HTMLButtonElement>, key: string, puck: Puck): void => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    press.current = { key, puck, x: event.clientX, y: event.clientY, at: Date.now() };
  };
  const move = (event: PointerEvent<HTMLButtonElement>): void => {
    const held = press.current;
    if (held === null) return;
    if (held.bots === undefined) {
      if (Math.hypot(event.clientX - held.x, event.clientY - held.y) < DRAG_PX) return;
      held.bots = Date.now() - held.at >= HOLD_MS || held.puck.bots.length === 1 ? held.puck.bots : [held.key];
      setOpened(null);
    }
    setDrag({ bots: held.bots, x: event.clientX, y: event.clientY, target: puckAt(event.clientX, event.clientY, held.bots) });
  };
  const up = (event: PointerEvent<HTMLButtonElement>): void => {
    const held = press.current;
    press.current = null;
    if (held === null) return;
    if (held.bots === undefined) {
      // A click: open the bot, or close it when it is open.
      setOpened(opened?.key === held.key ? null : { key: held.key, ...besideOf(event.currentTarget.getBoundingClientRect(), held.puck.edge) });
      return;
    }
    const target = puckAt(event.clientX, event.clientY, held.bots);
    const { edge, at } = snapPuck(event.clientX, event.clientY, window.innerWidth, window.innerHeight);
    const next = target !== null ? joinPuck(laid, held.bots, target) : takeOut(laid, held.bots, `p${Date.now()}`, edge, at);
    setPucks(next);
    writePucks(next);
    setDrag(null);
  };
  const cancel = (): void => {
    press.current = null;
    setDrag(null);
  };

  if (bots.size === 0) return null;
  const openedBot = opened === null ? undefined : bots.get(opened.key);
  const ghost = drag === null ? undefined : bots.get(drag.bots[0]!);

  return (
    <div className="web-bots" data-dragging={drag === null ? 'false' : 'true'}>
      {laid.map((puck) => {
        const { shown, more } = splitCluster(puck.bots);
        return (
          <div
            key={puck.id}
            ref={(element) => {
              if (element === null) puckBoxes.current.delete(puck.id);
              else puckBoxes.current.set(puck.id, element);
            }}
            className="web-bot-puck"
            data-edge={puck.edge}
            data-target={drag?.target === puck.id ? 'true' : 'false'}
            style={{ '--at': puck.at } as CSSProperties}
          >
            {shown.map((key) => {
              const bot = bots.get(key)!;
              const mood = drag?.bots.includes(key) === true ? 'observing' : opened?.key === key ? 'happy' : hovered === key ? 'observing' : 'idle';
              return (
                <button
                  key={key}
                  type="button"
                  className="web-bot-puck__bot"
                  data-open={opened?.key === key ? 'true' : 'false'}
                  data-moving={drag?.bots.includes(key) === true ? 'true' : 'false'}
                  title={bot.name}
                  aria-label={bot.name}
                  onMouseEnter={() => setHovered(key)}
                  onMouseLeave={() => setHovered((held) => (held === key ? null : held))}
                  onPointerDown={(event) => down(event, key, puck)}
                  onPointerMove={move}
                  onPointerUp={up}
                  onPointerCancel={cancel}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') return;
                    event.preventDefault();
                    setOpened(opened?.key === key ? null : { key, ...besideOf(event.currentTarget.getBoundingClientRect(), puck.edge) });
                  }}
                >
                  <Bood body={bot.body} color={bot.color} mood={mood} width={WIDTH} />
                </button>
              );
            })}
            {more === 0 ? null : (
              <button
                type="button"
                className="web-bot-puck__more"
                aria-label={t('bots/layer/more', { count: more })}
                title={t('bots/layer/more', { count: more })}
                onClick={(event) => setOverflow({ ...besideOf(event.currentTarget.getBoundingClientRect(), puck.edge), bots: puck.bots.slice(shown.length) })}
              >
                {`+${more}`}
              </button>
            )}
          </div>
        );
      })}
      {drag === null || ghost === undefined ? null : (
        <div className="web-bot-ghost" style={{ left: drag.x, top: drag.y }} aria-hidden="true">
          <Bood body={ghost.body} color={ghost.color} mood="observing" width={WIDTH} still />
          {drag.bots.length > 1 ? <span className="web-bot-puck__more">{`+${drag.bots.length - 1}`}</span> : null}
        </div>
      )}
      {overflow === null ? null : (
        <ContextMenu
          spec={{ items: overflow.bots.map((key) => ({ title: bots.get(key)?.name ?? key, onSelect: (menu) => { menu.closeMenu(); setOpened({ key, x: overflow.x, y: overflow.y }); } })) }}
          x={overflow.x}
          y={overflow.y}
          onClose={() => setOverflow(null)}
        />
      )}
      {opened === null || openedBot === undefined ? null : (
        <BotPopover host={refOf(opened.key).host} bot={openedBot} x={opened.x} y={opened.y} onClose={() => setOpened(null)} />
      )}
    </div>
  );
}
