import type { BindingPath, ComponentNode, Disposable, MountDisplay, Scena } from '@softov/scena/types';
import { combineDisposables } from '@softov/scena';

/** The sidebar beside the page: the open session's details and its changes, as tabs. */
export const RIGHT_SIDEBAR = 'sidebar:right';

/** The command slot of a tab strip's "..." menu. */
const GROUP_MENU_SLOT = 'tab-group:context';

/** Where a strip's menu names its surface. */
const SURFACE_NAME = '$/surface/name' as BindingPath;

/**
 * Mounts a tab in the right sidebar for as long as the returned disposable
 * lives. Closed with its ×, the tab is offered again in the sidebar's "..."
 * menu as "Show <title>" with `icon`, which opens it as the active tab.
 */
export function mountRight(
  scena: Scena,
  tab: { key: string; resource: ComponentNode; props: MountDisplay & { title: string } },
  icon: string,
): Disposable {
  const declaration = { ...tab, surface: RIGHT_SIDEBAR } as const;
  let mounted = scena.surfaces.mount(declaration);
  const open = (): boolean => scena.surfaces.listAt(RIGHT_SIDEBAR).some((mount) => mount.key === tab.key);
  return combineDisposables(
    { dispose: () => mounted.dispose() },
    scena.commands.register({
      id: `ahp.showRight.${tab.key}`,
      title: `Show ${tab.props.title}`,
      icon,
      slots: [GROUP_MENU_SLOT],
      // The menu puts its strip's surface in the store; a function `when` is asked with no snapshot.
      when: () => scena.store.get(SURFACE_NAME) === RIGHT_SIDEBAR && !open(),
      run: (ctx) => {
        ctx.host?.closeMenu();
        mounted.dispose();
        mounted = scena.surfaces.mount(declaration);
        const current = scena.layout.get().surfaces[RIGHT_SIDEBAR];
        scena.layout.setSurface(RIGHT_SIDEBAR, { ...current, visible: true, activeContainerKey: tab.key });
      },
    }),
  );
}
