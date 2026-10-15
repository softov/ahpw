import { useEffect, useState, type ReactElement } from 'react';
import { useI18n } from '@softov/scena/react';
import { Button, CheckBox, Modal, Spinner, TextField } from '@softov/scena/ui';
import { plural } from '../../i18n/locales.js';
import { textOf } from '../../bridges/words.js';
import type { ChangesetForm } from './changeset.js';
import type { PullRequestDraft } from './followup.js';
import type { Change } from './words.js';

/** What a commit takes: the staged files, or every change when none is staged. */
function takes(files: readonly Change[]): string {
  const staged = files.filter((one) => one.staged).length;
  if (staged > 0) return plural('changes/commit/staged', staged);
  return plural('changes/commit/all', files.length);
}

function CommitForm({ form, files, onCommit, onClose }: { form: Extract<ChangesetForm, { kind: 'commit' }>; files: readonly Change[]; onCommit: (message: string) => void; onClose: () => void }): ReactElement {
  const { t } = useI18n();
  const [message, setMessage] = useState('');
  const question = textOf(form.operation.confirmation);
  const ready = message.trim() !== '';
  return (
    <Modal open title={form.operation.label} onClose={onClose}>
      <div className="web-changeset-form">
        <TextField label={t('changes/commit/message')} multiline rows={4} value={message} placeholder={t('changes/commit/placeholder')} onChange={setMessage} />
        <p className="web-note">{takes(files)}</p>
        {question === '' ? null : <p className="web-note">{question}</p>}
        <div className="web-changeset-form__actions">
          <Button label={t('changes/cancel')} variant="ghost" onClick={onClose} />
          <Button label={form.operation.label} variant="primary" disabled={!ready} onClick={() => onCommit(message.trim())} />
        </div>
      </div>
    </Modal>
  );
}

function PullRequestForm({ form, onCreate, onClose }: { form: Extract<ChangesetForm, { kind: 'pull-request' }>; onCreate: (draft: PullRequestDraft, isDraft: boolean) => void; onClose: () => void }): ReactElement {
  const { t } = useI18n();
  const [title, setTitle] = useState(form.draft.title);
  const [description, setDescription] = useState(form.draft.description);
  const [isDraft, setIsDraft] = useState(false);
  // The host's prepared draft fills the boxes once it arrives.
  useEffect(() => {
    setTitle(form.draft.title);
    setDescription(form.draft.description);
  }, [form.draft]);
  const branches = form.draft.branchName === null && form.draft.baseBranchName === null ? null : `${form.draft.branchName ?? '?'} \u{2192} ${form.draft.baseBranchName ?? '?'}`;
  const ready = !form.preparing && form.create !== null && title.trim() !== '';
  return (
    <Modal open title={t('changes/pr/title')} onClose={onClose}>
      <div className="web-changeset-form">
        {form.preparing ? <Spinner label={t('changes/pr/preparing')} /> : null}
        {form.draft.repository === null && branches === null ? null : (
          <p className="web-note">{[form.draft.repository, branches].filter((one) => one !== null).join(' \u{00B7} ')}</p>
        )}
        <TextField label={t('changes/pr/titleLabel')} value={title} placeholder={t('changes/pr/titlePlaceholder')} disabled={form.preparing} onChange={setTitle} />
        <TextField label={t('changes/pr/description')} multiline rows={8} value={description} placeholder={t('changes/pr/descriptionPlaceholder')} disabled={form.preparing} onChange={setDescription} />
        <CheckBox label={t('changes/pr/draft')} value={isDraft} onChange={setIsDraft} />
        <p className="web-note">
          {form.create === null
            ? t('changes/pr/cannotCreate')
            : t('changes/pr/explain')}
        </p>
        <div className="web-changeset-form__actions">
          <Button label={t('changes/cancel')} variant="ghost" onClick={onClose} />
          {form.create === null ? null : (
            <Button label={form.create.label} variant="primary" disabled={!ready} onClick={() => onCreate({ ...form.draft, title: title.trim(), description }, isDraft)} />
          )}
        </div>
      </div>
    </Modal>
  );
}

/** The form a commit or a pull request asks for before the server runs it. */
export function ChangesetForms({ form, files, onCommit, onPullRequest, onClose }: {
  form: ChangesetForm | null;
  files: readonly Change[];
  onCommit: (message: string) => void;
  onPullRequest: (draft: PullRequestDraft, isDraft: boolean) => void;
  onClose: () => void;
}): ReactElement | null {
  if (form === null) return null;
  return form.kind === 'commit'
    ? <CommitForm form={form} files={files} onCommit={onCommit} onClose={onClose} />
    : <PullRequestForm form={form} onCreate={onPullRequest} onClose={onClose} />;
}
