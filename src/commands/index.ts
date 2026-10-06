import type { BindingPath, Disposable, Scena } from '@softov/scena/types';
import { combineDisposables, isOverlaid, resolveSurfacePresentation, type ModusClass } from '@softov/scena';
import { ApiError, call } from '../api.js';
import { PRESENTATION } from '../presentation.js';
import { MissingInput, requestOf } from '../manifest/input.js';
import { ACTIVE_COMMAND, MANIFEST, manifestProvider, runPath, type Run } from '../manifest/data.js';
import { sectionId, sectionsOf } from '../manifest/sections.js';
import type { ProgramManifest } from '../manifest/types.js';
import CommandExplorer from './Explorer.js';
import CommandPage from './Page.js';
import { SESSIONS_SECTION } from '../ahp/index.js';

/** The activity bar entries that are not manifest groups, by the name their letters come from. */
const OTHER_ENTRIES = ['sessions'];

/** The display size class the modus backend publishes. */
const MODUS_CLASS = '$/modus/class' as BindingPath;

/** Arguments of `ahpd.open`. */
export interface OpenArgs {
  id: string;
}

/** Arguments of `ahpd.run`. */
export interface RunArgs {
  id: string;
  values: Record<string, unknown>;
}

/** Run one command and keep its answer at `runPath(id)`. */
async function run(scena: Scena, { id, values }: RunArgs): Promise<void> {
  const command = scena.store.get<ProgramManifest>(MANIFEST)?.commands.find((one) => one.id === id);
  if (command === undefined) return;
  const path = runPath(id);
  scena.store.set(path, { state: 'running' } satisfies Run);
  try {
    const data = await call(requestOf(command, values));
    scena.store.set(path, { state: 'done', data, at: Date.now() } satisfies Run);
  } catch (error) {
    const status = error instanceof ApiError ? error.status : error instanceof MissingInput ? 400 : 0;
    const message = error instanceof Error ? error.message : String(error);
    scena.store.set(path, { state: 'failed', status, message, at: Date.now() } satisfies Run);
  }
}

/** The command list, the command page and what opens and runs one. */
export function registerCommands(scena: Scena): Disposable {
  return combineDisposables(
    scena.store.registerDataProvider(manifestProvider),

    scena.components.register({
      component: 'CommandExplorer',
      category: 'page',
      renderer: { kind: 'react', load: async () => ({ default: CommandExplorer as unknown }) },
    }),
    scena.components.register({
      component: 'CommandPage',
      category: 'page',
      renderer: { kind: 'react', load: async () => ({ default: CommandPage as unknown }) },
    }),

    scena.commands.register({
      id: 'ahpd.open',
      title: 'Open command',
      run: (ctx, args) => {
        const id = (args as OpenArgs | undefined)?.id;
        if (id === undefined) return;
        ctx.store.set(ACTIVE_COMMAND, id);
        ctx.surfaces.open({
          surface: 'main',
          key: `command:${id}`,
          resource: { component: 'CommandPage', commandId: id },
          props: { title: id.split('.').join(' ') },
        });
        // A sidebar lifted over the page is put away once it has done its job.
        const modus = ctx.store.get<ModusClass>(MODUS_CLASS) ?? 'large';
        if (isOverlaid(resolveSurfacePresentation('sidebar:left', modus, PRESENTATION))) {
          const current = ctx.scena.layout.get().surfaces['sidebar:left'];
          ctx.scena.layout.setSurface('sidebar:left', { ...current, visible: false });
        }
      },
    }),
    scena.commands.register({
      id: 'ahpd.run',
      title: 'Run command',
      run: async (ctx, args) => {
        if (args === undefined) return;
        await run(ctx.scena, args as RunArgs);
      },
    }),

    registerSections(scena),
  );
}

/**
 * One activity bar entry and one sidebar list per group, from the manifest.
 *
 * Mounted when the manifest arrives and again if it changes. A sidebar showing
 * neither the sessions nor a group of this manifest, on a first visit or after
 * a group went away, is moved to the sessions.
 */
function registerSections(scena: Scena): Disposable {
  let mounted: Disposable | undefined;
  const mount = (manifest: ProgramManifest | undefined): void => {
    mounted?.dispose();
    mounted = undefined;
    if (manifest === undefined) return;
    const sections = sectionsOf(manifest, OTHER_ENTRIES);
    mounted = combineDisposables(...sections.flatMap((section) => [
      scena.surfaces.mount({
        surface: 'activitybar',
        key: `section:${section.name}:nav`,
        resource: { component: 'ActivityBarItem', icon: section.icon, label: section.title, section: sectionId(section.name) },
      }),
      scena.surfaces.mount({
        surface: 'sidebar:left',
        key: `section:${section.name}:explorer`,
        when: `$/layout/surfaces/sidebar:left/section == "${sectionId(section.name)}"`,
        resource: { component: 'CommandExplorer', group: section.name },
      }),
    ]));
    const current = scena.layout.get().surfaces['sidebar:left'];
    const known = current?.section === SESSIONS_SECTION || sections.some((section) => sectionId(section.name) === current?.section);
    if (!known) scena.layout.setSurface('sidebar:left', { ...current, section: SESSIONS_SECTION });
  };
  const watching = scena.store.subscribe(MANIFEST, (value) => mount(value as ProgramManifest | undefined));
  mount(scena.store.get<ProgramManifest>(MANIFEST));
  return {
    dispose: () => {
      watching.dispose();
      mounted?.dispose();
    },
  };
}
