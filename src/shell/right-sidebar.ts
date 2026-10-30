import type { BindingPath, ComponentNode, Disposable, Label, MountDisplay, Scena, TabPanelLeaf, TabPanelNode } from '@softov/scena/types';
import { combineDisposables, resolveLabel, translate } from '@softov/scena';
import { english } from '../i18n/locales.js';
import { sessionKey } from '../resources/sessions/focus.js';
import { ACTIVE_SESSION, type ActiveSession } from '../resources/sessions/state.js';
import { PALETTE_SLOT } from './CommandPalette.js';

/** The sidebar beside the page: the open session's details and its changes, as tabs. */
export const RIGHT_SIDEBAR = 'sidebar:right';

/** The command slot of a tab strip's "..." menu. */
const GROUP_MENU_SLOT = 'tab-group:context';

/** Where a strip's menu names its surface. */
const SURFACE_NAME = '$/surface/name' as BindingPath;

/** Where a placed view opens: `sidebar`, or `tab` beside the session in `main`. */
export type ViewsPlace = 'sidebar' | 'tab';

export const VIEWS_PLACES: readonly ViewsPlace[] = ['sidebar', 'tab'];

/** A UI setting that places views: its value in the store, kept in localStorage, one per browser. */
export interface Placing {
  path: BindingPath;
  /** The place now: the store's, then the kept one, then `sidebar`. */
  read: (scena: Scena) => ViewsPlace;
  /** Sets and keeps the place; each view it places moves with it. */
  set: (scena: Scena, place: ViewsPlace) => void;
}

export function placing(path: BindingPath, storageKey: string): Placing {
  const kept = (): string | null => {
    try {
      return localStorage.getItem(storageKey);
    } catch {
      return null;
    }
  };
  return {
    path,
    read: (scena) => ((scena.store.get<string>(path) ?? kept()) === 'tab' ? 'tab' : 'sidebar'),
    set: (scena, place) => {
      try {
        localStorage.setItem(storageKey, place);
      } catch {
        // The store still has it for this visit.
      }
      scena.store.set(path, place);
    },
  };
}

/** Where Session Info and Changes open, as `ui.sessionViewsPlace` sets it. */
export const SESSION_VIEWS = placing('$/shell/sessionViewsPlace' as BindingPath, 'ahpw.sessionViewsPlace');

/** A view `mountRight` holds, by its key. */
interface View {
  /** The setting that places it; without one, as Files, it stays in the sidebar. */
  placed: Placing | undefined;
  /** Mounts it in the sidebar, again when it is there already. */
  toSidebar: () => void;
  /** Takes it out of the sidebar. */
  fromSidebar: () => void;
  open: { resource: ComponentNode; props: MountDisplay & { title: Label } };
}

const views = new Map<string, View>();

/** Whether `surface` has the tab `key` open. */
const isOpenAt = (scena: Scena, surface: string, key: string): boolean => scena.surfaces.listAt(surface).some((mount) => mount.key === key);

const placeOf = (scena: Scena, view: View): ViewsPlace => view.placed?.read(scena) ?? 'sidebar';

function leaves(node: TabPanelNode): TabPanelLeaf[] {
  return node.kind === 'leaf' ? [node] : [...leaves(node.first), ...leaves(node.second)];
}

function mapLeaves(node: TabPanelNode, change: (leaf: TabPanelLeaf) => TabPanelNode): TabPanelNode {
  if (node.kind === 'leaf') return change(node);
  return { ...node, first: mapLeaves(node.first, change), second: mapLeaves(node.second, change) };
}

/**
 * The tab tree with `key` active in a group beside the session's tab: the
 * first other group, or a new group to the right when the session's group is
 * the only one. Without the session in the tree, the tree stays as it is.
 */
export function besideSession(tree: TabPanelNode, session: string, key: string, newId: string): TabPanelNode {
  const without = mapLeaves(tree, (leaf) => {
    if (!leaf.tabs.includes(key)) return leaf;
    const { activeKey, ...rest } = leaf;
    const tabs = leaf.tabs.filter((one) => one !== key);
    const next = activeKey === key ? tabs[0] : activeKey;
    return next === undefined ? { ...rest, tabs } : { ...rest, tabs, activeKey: next };
  });
  const all = leaves(without);
  const home = all.find((leaf) => leaf.tabs.includes(session));
  if (home === undefined) return tree;
  const other = all.find((leaf) => leaf !== home);
  if (other !== undefined) return mapLeaves(without, (leaf) => (leaf === other ? { ...leaf, tabs: [...leaf.tabs, key], activeKey: key } : leaf));
  return mapLeaves(without, (leaf) => (leaf === home ? { kind: 'split', direction: 'row', ratio: 0.5, first: leaf, second: { kind: 'leaf', id: newId, tabs: [key], activeKey: key } } : leaf));
}

/** Opens the view on `main`, in a group beside the focused session when `main` has groups. */
function openBeside(scena: Scena, key: string, view: View): void {
  scena.surfaces.open({ surface: 'main', key, resource: view.open.resource, props: view.open.props } as never);
  const main = scena.layout.get().surfaces.main;
  const active = scena.store.get<ActiveSession>(ACTIVE_SESSION);
  const tree = main?.tabPanel?.tree;
  if (main?.layout !== 'tab-panel' || tree === undefined || active === undefined) return;
  const placed = besideSession(tree, sessionKey(active.host, active.resource), key, `g_${Math.random().toString(36).slice(2, 10)}`);
  scena.layout.setSurface('main', { ...main, tabPanel: { tree: placed }, activeContainerKey: key });
}

/** Shows the view in the sidebar as its active tab, and the sidebar with it. */
function showInSidebar(scena: Scena, key: string, view: View): void {
  if (!isOpenAt(scena, RIGHT_SIDEBAR, key)) view.toSidebar();
  const current = scena.layout.get().surfaces[RIGHT_SIDEBAR];
  scena.layout.setSurface(RIGHT_SIDEBAR, { ...current, visible: true, activeContainerKey: key });
}

/**
 * Shows the view `key` where the setting places it, as the active tab:
 * mounts it again when its × closed it, and shows its surface.
 */
export function showView(scena: Scena, key: string): void {
  const view = views.get(key);
  if (view === undefined) return;
  if (placeOf(scena, view) === 'sidebar') {
    showInSidebar(scena, key, view);
    return;
  }
  view.fromSidebar();
  if (isOpenAt(scena, 'main', key)) scena.surfaces.focus(key);
  else openBeside(scena, key, view);
}

/** Moves an open view to the place the setting now names; a view closed in `main` comes back in the sidebar. */
function move(scena: Scena, key: string, view: View): void {
  if (placeOf(scena, view) === 'tab') {
    if (!isOpenAt(scena, RIGHT_SIDEBAR, key)) return;
    view.fromSidebar();
    openBeside(scena, key, view);
    return;
  }
  if (isOpenAt(scena, 'main', key)) scena.surfaces.close(key);
  if (!isOpenAt(scena, RIGHT_SIDEBAR, key)) view.toSidebar();
}

/**
 * Mounts a tab in the right sidebar for as long as the returned disposable
 * lives. Closed with its ×, the tab is offered again in the sidebar's "..."
 * menu as "Show <title>" with `icon`, which opens it as the active tab.
 * A `{ t }` title follows a language switch, in the tab and in that menu.
 * The palette has a command that shows the tab from any state: `command`
 * gives its title, "Show <title>" when it has none, and its `keys`. With
 * `placed`, that setting may put the tab in `main`.
 */
export function mountRight(
  scena: Scena,
  tab: { key: string; resource: ComponentNode; props: MountDisplay & { title: Label } },
  icon: string,
  command: { title?: Label; keys?: string; placed?: Placing } = {},
): Disposable {
  const declaration = { ...tab, surface: RIGHT_SIDEBAR } as const;
  let mounted: Disposable | null = null;
  const view: View = {
    placed: command.placed,
    toSidebar: () => {
      mounted?.dispose();
      mounted = scena.surfaces.mount(declaration);
    },
    fromSidebar: () => {
      mounted?.dispose();
      mounted = null;
    },
    open: { resource: tab.resource, props: tab.props },
  };
  views.set(tab.key, view);
  // In `tab` place the view starts closed; the main panel's kept tabs bring it back.
  if (placeOf(scena, view) === 'sidebar') view.toSidebar();
  const resolve = (label: Label): string => resolveLabel(label, { get: (path) => scena.store.get(path as BindingPath), translate });
  const show = (): string => translate('shell/sidebar/show', { title: resolve(tab.props.title) });
  let place = placeOf(scena, view);
  return combineDisposables(
    {
      dispose: () => {
        views.delete(tab.key);
        view.fromSidebar();
      },
    },
    view.placed !== undefined
      ? scena.store.subscribe(view.placed.path, () => {
        const now = placeOf(scena, view);
        if (now === place) return;
        place = now;
        move(scena, tab.key, view);
      })
      : { dispose: () => undefined },
    scena.commands.register({
      id: `ahp.showRight.${tab.key}`,
      title: show,
      icon,
      slots: [GROUP_MENU_SLOT],
      // The menu puts its strip's surface in the store; a function `when` is asked with no snapshot.
      when: () => scena.store.get(SURFACE_NAME) === RIGHT_SIDEBAR && placeOf(scena, view) === 'sidebar' && !isOpenAt(scena, RIGHT_SIDEBAR, tab.key),
      run: (ctx) => {
        ctx.host?.closeMenu();
        showView(scena, tab.key);
      },
    }),
    scena.commands.register({
      id: `ahp.view.${tab.key}`,
      title: () => (command.title === undefined ? show() : resolve(command.title)),
      // The English title finds the command in any language.
      keywords: [command.title, tab.props.title].flatMap((label) => (typeof label === 'object' && label !== null && 't' in label ? [english(label.t)] : [])),
      icon,
      category: 'View',
      slots: [PALETTE_SLOT],
      ...(command.keys === undefined ? {} : { keys: command.keys }),
      run: () => showView(scena, tab.key),
    }),
  );
}
