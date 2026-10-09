import type { Disposable, Label, Scena, SessionMount, SessionSnapshot, SessionStorage } from '@softov/scena/types';
import { createLocalStorageSessionStorage } from '@softov/scena/core';

/** A main tab as kept: scena's mount, with the title its tab showed until the page loads its own. */
type KeptMount = SessionMount & { title?: Label };

const stored = createLocalStorageSessionStorage({ key: 'ahpd-web.session.v1' });

/** The main panel's tabs only; the sidebars are the shell's, mounted when it registers. */
function keeper(scena: Scena): SessionStorage {
  return {
    load: () => stored.load(),
    clear: () => stored.clear(),
    // The icon is the component's, so a tab shows the current one.
    save: (snapshot: SessionSnapshot) => {
      const shown = new Map(scena.surfaces.listAt('main').map((one) => [one.key, one.props?.title]));
      const mounts: KeptMount[] = snapshot.mounts
        .filter((one) => one.surface === 'main')
        .map((one) => {
          const title = shown.get(one.key);
          return title === undefined ? one : { ...one, title };
        });
      return stored.save({ ...snapshot, mounts });
    },
  };
}

/** Reopens the main panel's tabs from the last visit, then keeps them as they change. */
export async function keepTabs(scena: Scena, live: () => boolean): Promise<Disposable | null> {
  const snapshot = await stored.load();
  if (!live()) return null;
  for (const mount of (snapshot?.mounts ?? []) as KeptMount[]) {
    if (mount.surface !== 'main' || scena.components.get(mount.component.component) === undefined) continue;
    scena.surfaces.open({ surface: 'main', key: mount.key, resource: mount.component, ...(mount.title === undefined ? {} : { props: { title: mount.title } }) } as never);
  }
  scena.setSessionStorage(keeper(scena));
  return scena.session.enableAutoPersist();
}
