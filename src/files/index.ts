import type { Disposable, Scena } from '@softov/scena/types';
import { combineDisposables } from '@softov/scena';
import { FILE_KIND, openAsItems, TEXT_VIEWER, viewersOf } from './viewers.js';
import { EMOJIcon } from '../emojis.js';

/** Arguments of `ahp.openFile`. */
export interface OpenFileArgs {
  uri: string;
  line?: number | null;
  end?: number | null;
  /** The viewer to open it in; by default the text when lines are named, else the file's first viewer. */
  viewer?: string;
}

/** Arguments of `ahp.openDiff`: the file, and the content of each side that exists. */
export interface OpenDiffArgs {
  file: string;
  before?: string;
  after?: string;
  /** The changeset the change is in and its id there, so the tab offers the host's operations on it. */
  changeset?: string;
  change?: string;
  /** Whether the changeset takes review marks. */
  review?: boolean;
}

const nameOf = (uri: string): string => decodeURIComponent(uri.replace(/\/+$/, '').split('/').pop() ?? uri);

/** Files and diffs, opened in `main` from links, tool calls and changes. */
export function registerFiles(scena: Scena): Disposable {
  return combineDisposables(
    scena.components.register({
      component: TEXT_VIEWER,
      category: 'page',
      renderer: { kind: 'react', load: () => import('./FilePage.js') },
      opens: { resourceKinds: [FILE_KIND], title: 'Text', icon: EMOJIcon.file, priority: 10 },
    }),
    scena.components.register({
      component: 'MarkdownPage',
      category: 'page',
      renderer: { kind: 'react', load: () => import('./MarkdownPage.js') },
      opens: { resourceKinds: [FILE_KIND], title: 'Markdown', icon: EMOJIcon.markdown, priority: 20, selector: '$/resource/ext == "md" || $/resource/ext == "markdown"' },
    }),
    scena.components.register({
      component: 'DiffPage',
      category: 'page',
      renderer: { kind: 'react', load: () => import('./DiffPage.js') },
    }),
    scena.commands.register({
      id: 'ahp.openFile',
      title: 'Open file',
      run: (ctx, args) => {
        const target = args as OpenFileArgs | undefined;
        if (target?.uri === undefined) return;
        const viewers = viewersOf(scena, target.uri);
        const named = target.line === undefined || target.line === null ? null : TEXT_VIEWER;
        const viewer = viewers.find((one) => one.component === (target.viewer ?? named)) ?? viewers[0];
        const component = viewer?.component ?? TEXT_VIEWER;
        ctx.surfaces.open({
          surface: 'main',
          key: `file:${component}:${target.uri}`,
          resource: { component, uri: target.uri, line: target.line ?? null, end: target.end ?? null },
          props: { title: nameOf(target.uri), icon: viewer?.opens?.icon ?? EMOJIcon.file },
        });
      },
    }),
    // A file tab's menu offers the file's other viewers.
    scena.mountMenus.register('tab:context', (mount) => {
      const node = mount.component as { component?: unknown; uri?: unknown };
      if (typeof node.uri !== 'string' || typeof node.component !== 'string') return [];
      if (!viewersOf(scena, node.uri).some((viewer) => viewer.component === node.component)) return [];
      return openAsItems(scena, node.uri, node.component);
    }),
    scena.commands.register({
      id: 'ahp.openDiff',
      title: 'Open diff',
      run: (ctx, args) => {
        const target = args as OpenDiffArgs | undefined;
        if (target?.file === undefined) return;
        ctx.surfaces.open({
          surface: 'main',
          key: `diff:${target.file}:${target.after ?? target.before ?? ''}`,
          resource: {
            component: 'DiffPage',
            file: target.file,
            ...(target.before === undefined ? {} : { before: target.before }),
            ...(target.after === undefined ? {} : { after: target.after }),
            ...(target.changeset === undefined ? {} : { changeset: target.changeset, change: target.change ?? null, review: target.review === true }),
          },
          props: { title: nameOf(target.file), icon: EMOJIcon.diff },
        });
      },
    }),
  );
}
