import { describe, expect, it } from 'vitest';
import { commitMeta, createPrMeta, decodeDataUri, externalFollowUp, operationForm, pullRequestDraft } from './followup.js';

const json = (value: unknown): string => `data:application/json,${encodeURIComponent(JSON.stringify(value))}`;
const op = (id: string) => ({ id, label: id, scopes: ['changeset'] }) as never;

describe('decodeDataUri', () => {
  it('reads percent-encoded and base64 bodies', () => {
    expect(decodeDataUri('data:text/plain,h%C3%A9')).toEqual({ contentType: 'text/plain', text: 'hé' });
    expect(decodeDataUri(`data:text/plain;base64,${btoa('hÃ©')}`)).toEqual({ contentType: 'text/plain', text: 'hé' });
    expect(decodeDataUri('file:///x')).toBeNull();
  });
});

describe('pullRequestDraft', () => {
  it('reads what prepare-pull-request answers', () => {
    const followUp = { content: { uri: json({ title: 'T', description: 'D', branchName: 'b', baseBranchName: 'main', context: { head: 1 } }), contentType: 'application/json' } };
    expect(pullRequestDraft(followUp)).toEqual({ title: 'T', description: 'D', branchName: 'b', baseBranchName: 'main', repository: null, context: { head: 1 } });
  });

  it('is not a draft without a context, or when external', () => {
    expect(pullRequestDraft({ content: { uri: json({ title: 'T' }) } })).toBeNull();
    expect(pullRequestDraft({ external: true, content: { uri: json({ title: 'T', context: 1 }) } })).toBeNull();
  });
});

describe('externalFollowUp', () => {
  it('is the link only when the follow-up says external', () => {
    expect(externalFollowUp({ external: true, content: { uri: 'https://github.com/o/r/pull/1' } })).toBe('https://github.com/o/r/pull/1');
    expect(externalFollowUp({ content: { uri: 'https://github.com/o/r/pull/1' } })).toBeNull();
  });
});

describe('metas', () => {
  it('carries the form back with the context it was prepared on', () => {
    expect(createPrMeta({ title: 'T', description: 'D', branchName: null, baseBranchName: null, repository: null, context: 7 }, true)).toEqual({
      'vscode.pullRequest': { title: 'T', description: 'D', draft: true, expectedContext: 7 },
    });
    expect(commitMeta('m')).toEqual({ 'ahpd.commit': { message: 'm' } });
  });
});

describe('operationForm', () => {
  it('asks for words before commit and the pull request pair only', () => {
    expect(operationForm(op('commit'))).toBe('commit');
    expect(operationForm(op('create-pr'))).toBe('pull-request');
    expect(operationForm(op('prepare-pull-request'))).toBe('pull-request');
    expect(operationForm(op('revert'))).toBeNull();
  });
});
