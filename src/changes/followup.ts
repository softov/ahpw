import type { ChangesetOperation } from '@microsoft/agent-host-protocol';

/** An object read without trusting its variant. */
function bag(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value !== '' ? value : null;
}

/** The `content` of an operation's `followUp`. */
function contentOf(followUp: unknown): { uri: string | null; contentType: string | null } {
  const content = bag(bag(followUp).content);
  return { uri: str(content.uri), contentType: str(content.contentType) };
}

/** A `data:` URI read locally, percent-encoded or `;base64`; `null` for anything else. */
export function decodeDataUri(uri: string): { contentType: string | null; text: string } | null {
  if (!uri.startsWith('data:')) return null;
  const comma = uri.indexOf(',');
  if (comma < 0) return null;
  const parts = uri.slice('data:'.length, comma).split(';');
  const body = uri.slice(comma + 1);
  try {
    const text = parts.includes('base64')
      ? new TextDecoder().decode(Uint8Array.from(atob(body.replace(/\s+/g, '')), (one) => one.charCodeAt(0)))
      : decodeURIComponent(body);
    return { contentType: parts[0] === '' ? null : parts[0] ?? null, text };
  } catch {
    return null;
  }
}

/** A pull request, as the form shows it and as `create-pr` takes it back. */
export interface PullRequestDraft {
  title: string;
  description: string;
  branchName: string | null;
  baseBranchName: string | null;
  repository: string | null;
  /** The host's opaque `context`, sent back whole so `create-pr` can check the tree has not moved. */
  context: unknown;
}

export const EMPTY_DRAFT: PullRequestDraft = { title: '', description: '', branchName: null, baseBranchName: null, repository: null, context: undefined };

/** The draft `prepare-pull-request` answers, as a `data:` JSON follow-up; `null` when it is not one. */
export function pullRequestDraft(followUp: unknown): PullRequestDraft | null {
  if (bag(followUp).external === true) return null;
  const { uri, contentType } = contentOf(followUp);
  if (uri === null) return null;
  const body = decodeDataUri(uri);
  if (body === null) return null;
  if (contentType !== null && !contentType.includes('json') && body.contentType?.includes('json') !== true) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(body.text);
  } catch {
    return null;
  }
  const held = bag(parsed);
  const title = str(held.title);
  if (title === null || !('context' in held)) return null;
  return {
    title,
    description: str(held.description) ?? str(held.body) ?? '',
    branchName: str(held.branchName),
    baseBranchName: str(held.baseBranchName),
    repository: str(held.repository),
    context: held.context,
  };
}

/** The link an `external: true` follow-up hands to the browser; `null` when it is not one. */
export function externalFollowUp(followUp: unknown): string | null {
  return bag(followUp).external === true ? contentOf(followUp).uri : null;
}

/** The `_meta` a `create-pr` carries: what the form holds, under the reference client's key. */
export function createPrMeta(draft: PullRequestDraft, isDraft: boolean): Record<string, unknown> {
  return {
    'vscode.pullRequest': {
      title: draft.title,
      description: draft.description,
      draft: isDraft,
      ...(draft.context === undefined ? {} : { expectedContext: draft.context }),
    },
  };
}

/** The `_meta` a `commit` carries: its message, under ahpd's key. */
export function commitMeta(message: string): Record<string, unknown> {
  return { 'ahpd.commit': { message } };
}

/** The form an operation's arguments need: the reference host's commit and pull request verbs. */
export function operationForm(operation: ChangesetOperation): 'commit' | 'pull-request' | null {
  if (operation.id === 'commit') return 'commit';
  if (operation.id === 'create-pr' || operation.id === 'prepare-pull-request') return 'pull-request';
  return null;
}
