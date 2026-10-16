import type { BindingPath, Disposable, MountAction, PickerAction, Scena } from '@softov/scena/types';
import { combineDisposables, isOverlaid, resolveSurfacePresentation, translate, type ModusClass } from '@softov/scena';
import { ApiError, call } from '../../lib/api.js';
import { PRESENTATION } from '../../shell/presentation.js';
import { MissingInput, requestOf } from '../manifest/input.js';
import { ACTIVE_COMMAND, ACTIVE_ITEM, MANIFEST, manifestProvider, runPath, type Run } from '../manifest/data.js';
import { sectionId, sectionsOf } from '../manifest/sections.js';
import type { ManifestCommand, ProgramManifest } from '../manifest/types.js';
import { createOf, listOf, roleOf } from '../manifest/roles.js';
import type { Section } from '../manifest/sections.js';
import { openPalette } from '../../shell/CommandPalette.js';
import { EMOJIcon } from '../emojis.js';
import { SESSIONS_SECTION } from '../sessions/index.js';


/** The display size class the modus backend publishes. */
const MODUS_CLASS = '$/modus/class' as BindingPath;

/** Arguments of `ahpd.open`. */
export interface OpenArgs {
  id: string;
  /** Values the form starts with, such as the key of the row it was opened from. */
  values?: Record<string, unknown>;
}

/** Arguments of `ahpd.openItem`: the list the item is a row of, its kind, and the title that names its row. */
export interface OpenItemArgs {
  list: string;
  kind: string;
  title: string;
}

/** A sidebar lifted over the page is put away once it has done its job. */
function hideOverlaid(scena: Scena, modus: ModusClass): void {
  if (!isOverlaid(resolveSurfacePresentation('sidebar:left', modus, PRESENTATION))) return;
  const current = scena.layout.get().surfaces['sidebar:left'];
  scena.layout.setSurface('sidebar:left', { ...current, visible: false });
}

/** Arguments of `ahpd.run`. */
export interface RunArgs {
  id: string;
  values: Record<string, unknown>;
}

/** Run one command and keep its answer at `runPath(id)`. Says whether it worked. */
async function run(scena: Scena, { id, values }: RunArgs): Promise<boolean> {
  const manifest = scena.store.get<ProgramManifest>(MANIFEST);
  const command = manifest?.commands.find((one) => one.id === id);
  if (manifest === undefined || command === undefined) return false;
  const path = runPath(id);
  if (roleOf(command) === 'list') listValues.set(id, values);
  scena.store.set(path, { state: 'running' } satisfies Run);
  try {
    const data = await call(requestOf(command, values));
    scena.store.set(path, { state: 'done', data, at: Date.now() } satisfies Run);
    refreshLists(scena, manifest, command);
    return true;
  } catch (error) {
    const status = error instanceof ApiError ? error.status : error instanceof MissingInput ? 400 : 0;
    const message = error instanceof Error ? error.message : String(error);
    scena.store.set(path, { state: 'failed', status, message, at: Date.now() } satisfies Run);
    return false;
  }
}

/** After an add, change or remove, the lists of that kind already shown are read again. */
function refreshLists(scena: Scena, manifest: ProgramManifest, command: ManifestCommand): void {
  const kind = command.resource?.kind;
  if (kind === undefined || command.effect === undefined || command.effect === 'read') return;
  for (const one of manifest.commands) {
    if (one.resource?.kind !== kind || roleOf(one) !== 'list') continue;
    const shown = scena.store.get<Run>(runPath(one.id));
    if (shown?.state === 'done' || shown?.state === 'failed') void run(scena, { id: one.id, values: listValues.get(one.id) ?? {} });
  }
}

/** The values each list was last run with, so a refresh asks the same question. */
const listValues = new Map<string, Record<string, unknown>>();

/** The command list, the command page and what opens and runs one. */
export function registerCommands(scena: Scena): Disposable {
  return combineDisposables(
    scena.store.registerDataProvider(manifestProvider),

    scena.components.register({
      component: 'CommandExplorer',
      category: 'page',
      renderer: { kind: 'react', load: () => import('./Explorer.js') },
    }),
    scena.components.register({
      component: 'CommandPage',
      category: 'page',
      renderer: { kind: 'react', load: () => import('./Page.js') },
    }),

    scena.commands.register({
      id: 'ahpd.open',
      title: () => translate('commands/commands/open'),
      run: (ctx, args) => {
        const { id, values } = (args as OpenArgs | undefined) ?? {};
        if (id === undefined) return;
        ctx.store.set(ACTIVE_COMMAND, id);
        const command = ctx.store.get<ProgramManifest>(MANIFEST)?.commands.find((one) => one.id === id);
        const key = command?.resource?.key;
        const named = key === undefined ? undefined : values?.[key];
        // An item's page is its own tab, titled by the item it is about.
        const item = named === undefined ? '' : Array.isArray(named) ? named.join(', ') : String(named);
        ctx.surfaces.open({
          surface: 'main',
          key: item === '' ? `command:${id}` : `command:${id}:${item}`,
          resource: { component: 'CommandPage', commandId: id, ...(values === undefined ? {} : { initial: values }) },
          props: { title: item === '' ? id.split('.').join(' ') : `${id.split('.').join(' ')} ${item}` },
        });
        hideOverlaid(ctx.scena, ctx.store.get<ModusClass>(MODUS_CLASS) ?? 'large');
      },
    }),
    scena.components.register({
      component: 'ItemPage',
      category: 'page',
      renderer: { kind: 'react', load: () => import('./Item.js') },
    }),
    scena.commands.register({
      id: 'ahpd.openItem',
      title: () => translate('commands/commands/openItem'),
      run: (ctx, args) => {
        const { list, kind, title } = (args as OpenItemArgs | undefined) ?? {};
        if (list === undefined || kind === undefined || title === undefined) return;
        ctx.store.set(ACTIVE_ITEM, `${kind}:${title}`);
        ctx.surfaces.open({
          surface: 'main',
          key: `item:${kind}:${title}`,
          resource: { component: 'ItemPage', list, kind, title },
          props: { title: `${kind} ${title}` },
        });
        hideOverlaid(ctx.scena, ctx.store.get<ModusClass>(MODUS_CLASS) ?? 'large');
      },
    }),
    scena.commands.register({
      id: 'ahpd.run',
      title: () => translate('commands/commands/run'),
      run: async (ctx, args) => {
        if (args === undefined) return false;
        return run(ctx.scena, args as RunArgs);
      },
    }),

    registerSections(scena),
  );
}

/**
 * One activity bar entry and one sidebar list per group, from the manifest.
 *
 * Mounted when the manifest arrives and again if it changes. A sidebar showing
 * a group this manifest no longer has is moved to the sessions.
 */
/**
 * A section's header: for a section that lists a kind of thing, Create (when
 * the kind has one), Reload (busy while the list runs) and the section's
 * commands; each is a command, registered for as long as the section is.
 */
function sectionHeader(scena: Scena, manifest: ProgramManifest, section: Section): { actions: MountAction[]; commands: Disposable } {
  const list = listOf(section.commands);
  if (list === undefined) return { actions: [], commands: { dispose: () => undefined } };
  const create = createOf(manifest, list.resource?.kind ?? '');
  const id = (what: string): string => `section.${section.name}.${what}`;
  const open = (command: ManifestCommand): void => void scena.commands.execute('ahpd.open', { id: command.id });
  const commandList = (): PickerAction[] => section.commands.map((command): PickerAction => ({
    title: command.pattern.join(' '),
    description: command.summary,
    onSelect: (host) => { host.closeMenu(); open(command); },
  }));
  const commands = combineDisposables(
    ...(create === undefined ? [] : [scena.commands.register({ id: id('create'), title: create.summary, run: () => open(create) })]),
    scena.commands.register({ id: id('reload'), title: () => translate('common/reload'), run: (ctx) => ctx.commands.execute('ahpd.run', { id: list.id, values: {} }) }),
    scena.commands.register({
      id: id('commands'),
      title: () => translate('commands/items/commands'),
      run: (ctx) => {
        const spec = { title: section.title, items: commandList() };
        if (ctx.host !== undefined) ctx.host.pushList(spec);
        else openPalette(ctx.scena, spec);
      },
    }),
  );
  const actions: MountAction[] = [
    ...(create === undefined ? [] : [{ command: id('create'), icon: '+', label: create.summary }]),
    { command: id('reload'), icon: EMOJIcon.reload, label: { t: 'common/reload' }, busy: `${runPath(list.id)}/state == "running"` },
    { command: id('commands'), icon: EMOJIcon.more, label: { t: 'commands/items/commands' } },
  ];
  return { actions, commands };
}

function registerSections(scena: Scena): Disposable {
  let mounted: Disposable | undefined;
  const mount = (manifest: ProgramManifest | undefined): void => {
    mounted?.dispose();
    mounted = undefined;
    if (manifest === undefined) return;
    const sections = sectionsOf(manifest);
    mounted = combineDisposables(...sections.flatMap((section) => {
      const header = sectionHeader(scena, manifest, section);
      return [
      header.commands,
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
        // scena draws the section's header from these; the title is the manifest's.
        props: { title: section.title, actions: header.actions },
      }),
    ];
    }));
    const current = scena.layout.get().surfaces['sidebar:left'];
    const gone = current?.section?.startsWith(sectionId('')) === true && !sections.some((section) => sectionId(section.name) === current.section);
    if (gone) scena.layout.setSurface('sidebar:left', { ...current, section: SESSIONS_SECTION });
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
