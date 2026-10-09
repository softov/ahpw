import { useEffect, useMemo, useState } from 'react';
import { useScena } from '@softov/scena/react';
import type { Scena } from '@softov/scena/types';
import { changesetReducer, type ChangesetOperation, type ChangesetState, type StateAction } from '@microsoft/agent-host-protocol';
import { dispatch, request } from '../connection/data.js';
import { useChannel } from '../connection/channel.js';
import { textOf } from '../connection/words.js';
import { confirm } from '../notify/index.js';
import { EMOJIcon } from '../emojis.js';
import { changeOf, type Change } from './words.js';

/** Whether an operation applies to the whole changeset, or to one file. */
export const scoped = (operation: ChangesetOperation, scope: 'changeset' | 'resource'): boolean => operation.scopes.map(String).includes(scope);

/** What the last operation answered, or why it failed. */
export interface Said {
  tone: 'info' | 'danger';
  text: string;
}

/** The host's icon hints this client has a glyph for; any other shows the label's first letter. */
const ICON: Record<string, string> = {
  add: '+',
  remove: '\u{2212}',
  discard: '\u{21B6}',
  check: EMOJIcon.check,
  trash: EMOJIcon.trash,
  'git-commit': EMOJIcon.check,
};

/** The glyph an operation's button shows. */
export const iconOf = (operation: ChangesetOperation): string => ICON[operation.icon ?? ''] ?? operation.label.charAt(0);

/** Opens the diff of one change, with the changeset it came from so the tab can act on it. */
export function openChange(scena: Scena, change: Change, changeset: string | undefined, review: boolean): void {
  void scena.commands.execute('ahp.openDiff', {
    file: change.file,
    ...(change.before === undefined ? {} : { before: change.before }),
    ...(change.after === undefined ? {} : { after: change.after }),
    ...(changeset === undefined ? {} : { changeset, change: change.id, review }),
  });
}

/** One changeset: its files and operations, a way to run them, and what the last one said. */
export function useChangeset(uri: string | undefined): {
  state: ChangesetState | undefined;
  error: string | null;
  files: Change[];
  operations: ChangesetOperation[];
  said: Said | null;
  run: (operation: ChangesetOperation, target?: Change) => Promise<void>;
  review: (changes: readonly Change[], reviewed: boolean) => void;
} {
  const scena = useScena();
  const channel = useChannel<ChangesetState>(uri, changesetReducer);
  const [said, setSaid] = useState<Said | null>(null);
  useEffect(() => setSaid(null), [uri]);
  const files = useMemo(() => (channel.state?.files ?? []).map(changeOf), [channel.state?.files]);

  const run = async (operation: ChangesetOperation, target?: Change): Promise<void> => {
    if (uri === undefined) return;
    const question = textOf(operation.confirmation);
    if (question !== '' && !(await confirm({ title: question, confirmLabel: operation.label, tone: 'danger' }))) return;
    setSaid(null);
    request('invokeChangesetOperation', {
      channel: uri,
      operationId: operation.id,
      ...(target === undefined ? {} : { target: { kind: 'resource', resource: target.file } }),
    } as never)
      .then((result) => {
        const answer = result as unknown as { message?: string | { markdown: string }; followUp?: { content?: { uri: string }; external?: string } } | null;
        if (answer?.message !== undefined) setSaid({ tone: 'info', text: textOf(answer.message) });
        if (answer?.followUp?.external !== undefined) window.open(answer.followUp.external, '_blank', 'noopener');
        else if (answer?.followUp?.content !== undefined) void scena.commands.execute('ahp.openFile', { uri: answer.followUp.content.uri });
      })
      .catch((error: unknown) => setSaid({ tone: 'danger', text: error instanceof Error ? error.message : String(error) }));
  };

  const review = (changes: readonly Change[], reviewed: boolean): void => {
    if (uri !== undefined && changes.length > 0) dispatch(uri, { type: 'changeset/filesReviewChanged', files: changes.map((one) => one.id), reviewed } as StateAction);
  };

  return { state: channel.state, error: channel.error, files, operations: channel.state?.operations ?? [], said, run, review };
}
