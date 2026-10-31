import { a2uiV010Converter } from '@softov/scena/core';
import type { ComponentNode } from '@softov/scena/types';
import type { PluginView, PluginViewComponent } from '../../bridges/plugins.js';

/** The kinds a plugin's view may use, as ahpd checks them; any other kind is not drawn. */
export const VIEW_KINDS: ReadonlySet<string> = new Set(['Text', 'Link', 'Button', 'Card', 'Row', 'Column', 'List', 'Divider', 'Icon']);

/** The ids a component names below it. */
const below = (one: PluginViewComponent): string[] => [...(one.child === undefined ? [] : [one.child]), ...(one.children ?? [])];

/** Whether a component names itself, directly or through the ones below it. */
function hasCycle(view: PluginView): boolean {
  const done = new Set<string>();
  const visit = (id: string, path: Set<string>): boolean => {
    if (path.has(id)) return true;
    if (done.has(id)) return false;
    const one = view.components[id];
    if (one === undefined) return false;
    path.add(id);
    const cut = below(one).some((next) => visit(next, path));
    path.delete(id);
    done.add(id);
    return cut;
  };
  return visit(view.root, new Set());
}

/**
 * A Button as scena's draws it: A2UI's `action` becomes the `onClick` that
 * scena turns into a `scena:action:event`, and its `child` the label it holds.
 */
function asScena(one: PluginViewComponent): PluginViewComponent {
  if (one.component !== 'Button') return one;
  const { action, child, ...rest } = one;
  return {
    ...rest,
    ...(action === undefined ? {} : { onClick: action }),
    ...(child === undefined ? {} : { children: [child] }),
  };
}

/**
 * A view as a node scena draws, or null when it has no root or names itself.
 * A component of a kind outside `VIEW_KINDS` is left out, so the host cannot
 * mount one of ahpw's own pages; scena draws its place as a missing component.
 */
export function viewNode(view: PluginView, surfaceId: string): ComponentNode | null {
  if (view.components[view.root] === undefined || hasCycle(view)) return null;
  const components = Object.fromEntries(Object.entries(view.components)
    .filter(([, one]) => VIEW_KINDS.has(one.component))
    .map(([id, one]) => [id, asScena(one)]));
  return a2uiV010Converter.translate({ schema: 'a2ui/v0.10', surfaceId, payload: { root: view.root, components } });
}

/** The methods the view's Buttons call, the only ones a click may send. */
export function viewMethods(view: PluginView): ReadonlySet<string> {
  return new Set(Object.values(view.components).flatMap((one) => (
    one.component === 'Button' && one.action !== undefined ? [one.action.event.name] : [])));
}
