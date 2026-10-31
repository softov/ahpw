import type { CanvasState } from '@microsoft/agent-host-protocol';
import type { Disposable, ReactiveStore, Scena } from '@softov/scena/types';
import { combineDisposables, translate } from '@softov/scena';
import { channelPath } from '../../bridges/data.js';
import { choose } from '../../shell/notify/index.js';
import { RIGHT_SIDEBAR } from '../../shell/right-sidebar.js';
import { canvasKey, canvasName } from './canvases.js';
import { CANVAS_OPENS, type CanvasPlace } from './settings.js';

/** Arguments of `ahp.openCanvas`. */
export interface OpenCanvasArgs {
  host: string;
  /** The chat that lists the canvas; its view closes when the chat no longer does. */
  chat: string;
  /** The canvas's `ahp-canvas:` channel. */
  resource: string;
  /** Where it opens; `ui.canvasOpens` decides without one. */
  place?: CanvasPlace;
}

/**
 * Where a canvas opens: the setting, or with `ask`, the answer to a question
 * that the setting then keeps. Null when the question is closed unanswered.
 */
async function canvasPlace(store: ReactiveStore): Promise<CanvasPlace | null> {
  const set = CANVAS_OPENS.read(store);
  if (set === 'main' || set === 'right') return set;
  const answer = await choose({
    title: translate('canvases/where'),
    body: translate('canvases/whereBody'),
    confirmLabel: translate('canvases/actions/openRight'),
    cancelLabel: translate('canvases/actions/openMain'),
  });
  if (answer === null) return null;
  const place = answer ? 'right' : 'main';
  CANVAS_OPENS.set(store, place);
  return place;
}

/** The view that shows a canvas, and the command that opens it. */
export function registerCanvases(scena: Scena): Disposable {
  return combineDisposables(
    scena.components.register({
      component: 'CanvasView',
      category: 'page',
      renderer: { kind: 'react', load: () => import('./CanvasView.js') },
    }),
    scena.commands.register({
      id: 'ahp.openCanvas',
      title: () => translate('canvases/commands/open'),
      run: async (ctx, args) => {
        const target = args as OpenCanvasArgs | undefined;
        if (target?.resource === undefined) return;
        const place = target.place ?? await canvasPlace(ctx.store);
        if (place === null) return;
        const { host, chat, resource } = target;
        const key = canvasKey(host, resource);
        const props = { title: canvasName(ctx.store.get<CanvasState>(channelPath(host, resource))) ?? translate('canvases/tab') };
        const node = { component: 'CanvasView', host, chat, resource };
        // One tab per canvas: opening it in one place takes it from the other.
        const other = place === 'main' ? RIGHT_SIDEBAR : 'main';
        if (ctx.surfaces.listAt(other).some((mount) => mount.key === key)) ctx.surfaces.close(key);
        if (place === 'right') {
          ctx.surfaces.open({ surface: RIGHT_SIDEBAR, key, resource: node, props });
          const right = ctx.scena.layout.get().surfaces[RIGHT_SIDEBAR];
          ctx.scena.layout.setSurface(RIGHT_SIDEBAR, { ...right, visible: true, activeContainerKey: key });
          return;
        }
        ctx.surfaces.open({ surface: 'main', key, resource: node, props });
      },
    }),
  );
}
