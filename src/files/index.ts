import type { Disposable, Scena } from '@softov/scena/types';
import { combineDisposables } from '@softov/scena';
import FilePage from './FilePage.js';
import DiffPage from './DiffPage.js';

/** Arguments of `ahp.openFile`. */
export interface OpenFileArgs {
  uri: string;
  line?: number | null;
  end?: number | null;
}

/** Arguments of `ahp.openDiff`: the file, and the content of each side that exists. */
export interface OpenDiffArgs {
  file: string;
  before?: string;
  after?: string;
}

const nameOf = (uri: string): string => decodeURIComponent(uri.replace(/\/+$/, '').split('/').pop() ?? uri);

/** Files and diffs, opened in `main` from links, tool calls and changes. */
export function registerFiles(scena: Scena): Disposable {
  return combineDisposables(
    scena.components.register({
      component: 'FilePage',
      category: 'page',
      renderer: { kind: 'react', load: async () => ({ default: FilePage as unknown }) },
    }),
    scena.components.register({
      component: 'DiffPage',
      category: 'page',
      renderer: { kind: 'react', load: async () => ({ default: DiffPage as unknown }) },
    }),
    scena.commands.register({
      id: 'ahp.openFile',
      title: 'Open file',
      run: (ctx, args) => {
        const target = args as OpenFileArgs | undefined;
        if (target?.uri === undefined) return;
        ctx.surfaces.open({
          surface: 'main',
          key: `file:${target.uri}`,
          resource: { component: 'FilePage', uri: target.uri, line: target.line ?? null, end: target.end ?? null },
          props: { title: nameOf(target.uri) },
        });
      },
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
          },
          props: { title: `\u{0394} ${nameOf(target.file)}` },
        });
      },
    }),
  );
}
