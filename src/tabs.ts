import type { Disposable, MountDisplay, Scena, SessionMount, SessionSnapshot, SessionStorage } from '@softov/scena/types';
import { createLocalStorageSessionStorage } from '@softov/scena/core';

/** A main tab as kept: scena's mount, with the title and icon its tab showed. */
type KeptMount = SessionMount & { props?: MountDisplay };

const stored = createLocalStorageSessionStorage({ key: 'ahpd-web.session.v1' });

/** The main panel's tabs only; the sidebars are the shell's, mounted when it registers. */
function keeper(scena: Scena): SessionStorage {
  return {
    load: () => stored.load(),
    clear: () => stored.clear(),
    // scena 0.5.0 leaves a mount's props out of its snapshot; the fix is in scena's next release.
    save: (snapshot: SessionSnapshot) => {
      const shown = new Map(scena.surfaces.listAt('main').map((one) => [one.key, one.props]));
      const mounts: KeptMount[] = snapshot.mounts
        .filter((one) => one.surface === 'main')
        .map((one) => {
          const props = shown.get(one.key);
          return props === undefined ? one : { ...one, props };
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
    scena.surfaces.open({ surface: 'main', key: mount.key, resource: mount.component, ...(mount.props === undefined ? {} : { props: mount.props }) } as never);
  }
  scena.setSessionStorage(keeper(scena));
  return scena.session.enableAutoPersist();
}
