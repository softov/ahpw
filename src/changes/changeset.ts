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
import { commitMeta, createPrMeta, EMPTY_DRAFT, externalFollowUp, operationForm, pullRequestDraft, type PullRequestDraft } from './followup.js';

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
  'git-commit': EMOJIcon.commit,
  'git-pull-request': EMOJIcon.pullRequest,
  'git-pull-request-create': EMOJIcon.pullRequest,
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

/** The form open for a verb that takes words before it runs. */
export type ChangesetForm =
  | { kind: 'commit'; operation: ChangesetOperation }
  | { kind: 'pull-request'; create: ChangesetOperation | null; draft: PullRequestDraft; preparing: boolean };

/** One changeset: its files and operations, a way to run them, and what the last one said. */
export function useChangeset(uri: string | undefined): {
  state: ChangesetState | undefined;
  error: string | null;
  files: Change[];
  operations: ChangesetOperation[];
  said: Said | null;
  form: ChangesetForm | null;
  run: (operation: ChangesetOperation, target?: Change) => Promise<void>;
  commit: (message: string) => void;
  pullRequest: (draft: PullRequestDraft, isDraft: boolean) => void;
  closeForm: () => void;
  review: (changes: readonly Change[], reviewed: boolean) => void;
} {
  const scena = useScena();
  const channel = useChannel<ChangesetState>(uri, changesetReducer);
  const [said, setSaid] = useState<Said | null>(null);
  const [form, setForm] = useState<ChangesetForm | null>(null);
  useEffect(() => {
    setSaid(null);
    setForm(null);
  }, [uri]);
  const files = useMemo(() => (channel.state?.files ?? []).map(changeOf), [channel.state?.files]);
  const operations = channel.state?.operations ?? [];

  /** Invoke as offered; the answer's follow-up, or `undefined` once a failure has been said. */
  const invoke = async (operation: ChangesetOperation, target?: Change, meta?: Record<string, unknown>): Promise<{ followUp?: unknown } | undefined> => {
    if (uri === undefined) return undefined;
    setSaid(null);
    try {
      const result = await request('invokeChangesetOperation', {
        channel: uri,
        operationId: operation.id,
        ...(target === undefined ? {} : { target: { kind: 'resource', resource: target.file } }),
        ...(meta === undefined ? {} : { _meta: meta }),
      } as never);
      const answer = result as unknown as { message?: string | { markdown: string }; followUp?: unknown } | null;
      if (answer?.message !== undefined) setSaid({ tone: 'info', text: textOf(answer.message) });
      return { followUp: answer?.followUp };
    } catch (error) {
      setSaid({ tone: 'danger', text: error instanceof Error ? error.message : String(error) });
      return undefined;
    }
  };

  /** Open what a follow-up names: a link out in a new tab, a host file in its viewer. */
  const follow = (followUp: unknown): void => {
    const external = externalFollowUp(followUp);
    if (external !== null) {
      window.open(external, '_blank', 'noopener');
      return;
    }
    const content = (followUp as { content?: { uri?: unknown } } | undefined)?.content?.uri;
    if (typeof content === 'string' && !content.startsWith('data:')) void scena.commands.execute('ahp.openFile', { uri: content });
  };

  /** The pull request form, filled by `prepare-pull-request` when the host offers it. */
  const openPullRequest = async (operation: ChangesetOperation): Promise<void> => {
    const create = operations.find((one) => one.id === 'create-pr') ?? (operation.id === 'create-pr' ? operation : null);
    const prepare = operations.find((one) => one.id === 'prepare-pull-request') ?? (operation.id === 'prepare-pull-request' ? operation : null);
    setForm({ kind: 'pull-request', create, draft: EMPTY_DRAFT, preparing: prepare !== null });
    if (prepare === null) return;
    const answer = await invoke(prepare);
    if (answer === undefined) {
      setForm(null);
      return;
    }
    const draft = pullRequestDraft(answer.followUp);
    setSaid(null);
    setForm((held) => (held?.kind === 'pull-request' ? { ...held, preparing: false, draft: draft ?? held.draft } : held));
  };

  const run = async (operation: ChangesetOperation, target?: Change): Promise<void> => {
    if (uri === undefined) return;
    const kind = target === undefined ? operationForm(operation) : null;
    if (kind === 'commit') {
      setForm({ kind: 'commit', operation });
      return;
    }
    const question = textOf(operation.confirmation);
    if (question !== '' && !(await confirm({ title: question, confirmLabel: operation.label, tone: 'danger' }))) return;
    if (kind === 'pull-request') {
      await openPullRequest(operation);
      return;
    }
    const answer = await invoke(operation, target);
    if (answer !== undefined) follow(answer.followUp);
  };

  const commit = (message: string): void => {
    if (form?.kind !== 'commit') return;
    const { operation } = form;
    setForm(null);
    void invoke(operation, undefined, commitMeta(message)).then((answer) => { if (answer !== undefined) follow(answer.followUp); });
  };

  const pullRequest = (draft: PullRequestDraft, isDraft: boolean): void => {
    if (form?.kind !== 'pull-request' || form.create === null) return;
    const { create } = form;
    setForm(null);
    void invoke(create, undefined, createPrMeta(draft, isDraft)).then((answer) => { if (answer !== undefined) follow(answer.followUp); });
  };

  const review = (changes: readonly Change[], reviewed: boolean): void => {
    if (uri !== undefined && changes.length > 0) dispatch(uri, { type: 'changeset/filesReviewChanged', files: changes.map((one) => one.id), reviewed } as StateAction);
  };

  return { state: channel.state, error: channel.error, files, operations, said, form, run, commit, pullRequest, closeForm: () => setForm(null), review };
}
