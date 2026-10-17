import { memo, useContext, useState, type MouseEvent, type ReactElement } from 'react';
import { useI18n, useScena } from '@softov/scena/react';
import { Alert, Button, Markdown } from '@softov/scena/ui';
import type {
  ResponsePart,
  StateAction,
  ToolCallState,
} from '@microsoft/agent-host-protocol';
import { elapsed, folderLabel, textOf } from '../../bridges/words.js';
import { codePath, fileLink } from '../files/link.js';
import { linkClicks } from '../files/clicks.js';
import { useSessionHost, WorkspaceContext } from './workspace.js';
import { CopyButton } from '../../shell/controls/CopyButton.js';
import { InputRequest } from './Question.js';
import { durationOf, fileOf, inputText, kindOf, lineOf, outcomeOf, outputOf, segmentsOf, type Outcome, type Output, type ToolKind } from './tool.js';
import { EMOJIcon } from '../emojis.js';

/** Sends one action on the chat this transcript shows. */
export type Send = (action: StateAction) => void;

/** Tool call statuses, as their wire values: the enum is ambient and `const`. */
const PENDING_CONFIRMATION = 'pending-confirmation';
const PENDING_RESULT_CONFIRMATION = 'pending-result-confirmation';

/** The mark a call carries collapsed, and the key of the word behind it. */
export const MARK: Record<Outcome, { glyph: string; label: string }> = {
  preparing: { glyph: EMOJIcon.pending, label: 'sessions/tool/preparing' },
  approval: { glyph: EMOJIcon.waiting, label: 'sessions/tool/approval' },
  running: { glyph: EMOJIcon.running, label: 'sessions/tool/running' },
  'sign-in': { glyph: EMOJIcon.waiting, label: 'sessions/tool/signIn' },
  review: { glyph: EMOJIcon.waiting, label: 'sessions/tool/review' },
  done: { glyph: EMOJIcon.check, label: 'sessions/tool/done' },
  failed: { glyph: EMOJIcon.cross, label: 'sessions/tool/failed' },
  cancelled: { glyph: EMOJIcon.cross, label: 'sessions/tool/cancelled' },
};

/** Clicks inside an agent's text, relative paths from the session's folder. */
function useLinkClicks(): (event: MouseEvent<HTMLElement>) => void {
  return linkClicks(useScena(), useSessionHost(), useContext(WorkspaceContext));
}

/** The icon of each kind of call. */
export const KIND_ICON: Record<ToolKind, string> = {
  terminal: EMOJIcon.terminal,
  read: EMOJIcon.read,
  search: EMOJIcon.search,
  edit: EMOJIcon.edit,
  subagent: EMOJIcon.subagent,
  web: EMOJIcon.web,
  other: EMOJIcon.dot,
};

/** A call's line, each file it names a link that opens the file and leaves the row closed. */
export function ToolLine({ line, file }: { line: string; file: string | undefined }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const workspace = useContext(WorkspaceContext);
  return (
    <span className="web-tool__line">
      {segmentsOf(line, file).map((segment, index) => {
        const target = segment.href === undefined ? null : segment.code === true ? codePath(segment.href, workspace) : fileLink(segment.href, workspace);
        if (target === null) return segment.code === true ? <code key={index}>{segment.text}</code> : <span key={index}>{segment.text}</span>;
        const open = (event: { stopPropagation: () => void; preventDefault: () => void }): void => {
          event.stopPropagation();
          event.preventDefault();
          void scena.commands.execute('ahp.openFile', { uri: target.uri, line: target.line, end: target.end });
        };
        return (
          <span
            key={index}
            role="link"
            tabIndex={0}
            className="web-tool__ref"
            title={t('sessions/attachments/open', { name: folderLabel(target.uri) })}
            onClick={open}
            onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') open(event); }}
          >
            {segment.text}
          </span>
        );
      })}
    </span>
  );
}

/** Text a person may want elsewhere, with a button that copies it. */
export function Block({ title, text }: { title: string; text: string }): ReactElement {
  return (
    <section className="web-tool__block">
      <div className="web-tool__block-head">
        <span>{title}</span>
        <CopyButton text={text} />
      </div>
      <pre className="web-tool__pre">{text}</pre>
    </section>
  );
}

export function OutputView({ out }: { out: Output }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  switch (out.kind) {
    case 'text':
      return <Block title={t('sessions/tool/output')} text={out.text} />;
    case 'terminal': {
      const exit = out.exitCode === undefined ? '' : ` \u{00B7} ${t('sessions/tool/exit', { code: out.exitCode })}`;
      return (
        <Block
          title={`${out.title}${exit}${out.truncated ? ` \u{00B7} ${t('sessions/tool/cutShort')}` : ''}`}
          text={out.text === '' ? t('sessions/tool/noOutput') : out.text}
        />
      );
    }
    case 'file':
      return (
        <p className="web-tool__file">
          <button
            type="button"
            className="web-link"
            title={out.before === undefined && out.after === undefined ? t('sessions/tool/openFile') : t('sessions/tool/openChange')}
            onClick={() => void (out.before === undefined && out.after === undefined
              ? scena.commands.execute('ahp.openFile', { uri: out.file })
              : scena.commands.execute('ahp.openDiff', { file: out.file, ...(out.before === undefined ? {} : { before: out.before }), ...(out.after === undefined ? {} : { after: out.after }) }))}
          >
            {out.path}
          </button>
          {out.added === undefined ? null : <span className="web-diff--add">+{out.added}</span>}
          {out.removed === undefined ? null : <span className="web-diff--remove">-{out.removed}</span>}
        </p>
      );
    case 'note':
      return <p className="web-note">{out.text}</p>;
  }
}

/** One tool call: its line, opened to what went in and came out. */
export function ToolCall({ call, send, live, turnId }: { call: ToolCallState; send: Send; live: boolean; turnId: string }): ReactElement {
  const outcome = outcomeOf(call);
  const waiting = live && (outcome === 'approval' || outcome === 'review' || outcome === 'sign-in');
  const [open, setOpen] = useState(false);
  const shown = open || waiting;
  const duration = durationOf(call);
  const input = inputText(call);
  const output = outputOf(call);
  const name = call.displayName || call.toolName;
  const risk = call.status === PENDING_CONFIRMATION ? call.riskAssessment : undefined;
  const file = fileOf(call);
  const scena = useScena();
  const { t } = useI18n();
  const mark = t(MARK[outcome].label);
  return (
    <div className="web-tool" data-outcome={outcome}>
      <button type="button" className="web-tool__row" aria-expanded={shown} title={mark} onClick={() => setOpen(!open)}>
        <span className="web-tool__mark" aria-label={mark}>{KIND_ICON[kindOf(call)]}</span>
        <ToolLine line={lineOf(call)} file={file} />
        {outcome === 'failed' || outcome === 'cancelled' ? <span className="web-tool__state">{mark}</span> : null}
        {duration === undefined || duration < 1000 ? null : <span className="web-tool__time">{elapsed(duration)}</span>}
      </button>
      {shown ? (
        <div className="web-tool__body">
          <dl className="web-tool__facts">
            <dt>{t('sessions/tool/tool')}</dt><dd><code>{call.toolName}</code>{name === call.toolName ? null : ` (${name})`}</dd>
            <dt>{t('sessions/tool/status')}</dt><dd>{mark}</dd>
            {file === undefined ? null : (
              <><dt>{t('sessions/tool/file')}</dt><dd><button type="button" className="web-link" onClick={() => void scena.commands.execute('ahp.openFile', { uri: file })}>{folderLabel(file)}</button></dd></>
            )}
            {call.intention === undefined ? null : <><dt>{t('sessions/tool/why')}</dt><dd>{call.intention}</dd></>}
            {risk === undefined || risk.status !== 'complete' ? null : <><dt>{t('sessions/tool/risk')}</dt><dd>{`${t('sessions/tool/safety', { safety: risk.safety })} \u{00B7} ${risk.reason}`}</dd></>}
          </dl>
          {input === '' ? null : <Block title={t('sessions/tool/arguments')} text={input} />}
          {output.map((one, index) => <OutputView key={index} out={one} />)}
          {live && call.status === PENDING_CONFIRMATION ? <Confirm call={call} send={send} turnId={turnId} /> : null}
          {live && call.status === PENDING_RESULT_CONFIRMATION ? (
            <div className="web-tool__actions">
              <Button label={t('sessions/tool/acceptResult')} variant="primary" onClick={() => send({ type: 'chat/toolCallResultConfirmed', turnId, toolCallId: call.toolCallId, approved: true } as StateAction)} />
              <Button label={t('sessions/tool/reject')} onClick={() => send({ type: 'chat/toolCallResultConfirmed', turnId, toolCallId: call.toolCallId, approved: false } as StateAction)} />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** One stretch of thinking: its opening words on the line, and opened, the whole text under a line that no longer repeats it. */
export function Reasoning({ text, running }: { text: string; running: boolean }): ReactElement {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const opening = text.replace(/[*_`#>]/g, '').replace(/\s+/g, ' ').trim();
  return (
    <div className="web-tool" data-outcome={running ? 'running' : 'thought'}>
      <button type="button" className="web-tool__row" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="web-tool__mark" aria-hidden="true">{EMOJIcon.thinking}</span>
        <span className="web-tool__line">{open ? t('sessions/activity/thinking') : t('sessions/tool/thinkingAbout', { text: opening })}</span>
      </button>
      {open ? <div className="web-tool__body web-md"><Markdown text={text} /></div> : null}
    </div>
  );
}

/** The host's options for a call awaiting approval, or approve and deny when it offers none. */
function Confirm({ call, send, turnId }: { call: ToolCallState; send: Send; turnId: string }): ReactElement {
  const { t } = useI18n();
  const approve = (optionId?: string): void => send({
    type: 'chat/toolCallConfirmed',
    turnId,
    toolCallId: call.toolCallId,
    approved: true,
    confirmed: 'user-action',
    ...(optionId === undefined ? {} : { selectedOptionId: optionId }),
  } as StateAction);
  const deny = (optionId?: string): void => send({
    type: 'chat/toolCallConfirmed',
    turnId,
    toolCallId: call.toolCallId,
    approved: false,
    reason: 'denied',
    ...(optionId === undefined ? {} : { selectedOptionId: optionId }),
  } as StateAction);
  const options = call.status === PENDING_CONFIRMATION ? call.options ?? [] : [];
  const title = call.status === PENDING_CONFIRMATION ? textOf(call.confirmationTitle) : '';
  return (
    <div className="web-tool__confirm">
      {title === '' ? null : <Markdown text={title} />}
      <div className="web-tool__actions">
        {options.length === 0 ? (
          <>
            <Button label={t('sessions/tool/approve')} variant="primary" onClick={() => approve()} />
            <Button label={t('sessions/tool/deny')} onClick={() => deny()} />
          </>
        ) : options.map((option) => (
          <Button
            key={option.id}
            label={option.label}
            {...(option.kind === 'approve' ? { variant: 'primary' as const } : {})}
            onClick={() => (option.kind === 'approve' ? approve(option.id) : deny(option.id))}
          />
        ))}
      </div>
    </div>
  );
}

/** One part of an agent's response. `live` is true while its turn still runs. A part the reducer did not touch renders once. */
export const Part = memo(function Part({ part, send, live, turnId }: { part: ResponsePart; send: Send; live: boolean; turnId: string }): ReactElement | null {
  const clicks = useLinkClicks();
  const scena = useScena();
  const { t } = useI18n();
  switch (String(part.kind)) {
    case 'markdown':
      return 'content' in part ? <div className="web-md" onClick={clicks}><Markdown text={part.content as string} /></div> : null;
    case 'contentRef': {
      const uri = 'uri' in part ? String(part.uri) : '';
      return (
        <button type="button" className="web-chip" onClick={() => void scena.commands.execute('ahp.openFile', { uri })}>
          {`${EMOJIcon.file} ${folderLabel(uri).split('/').pop() ?? uri}`}
        </button>
      );
    }
    case 'reasoning':
      return 'content' in part && part.content !== '' ? <Reasoning text={part.content as string} running={false} /> : null;
    case 'toolCall':
      return 'toolCall' in part ? <ToolCall call={part.toolCall} send={send} live={live} turnId={turnId} /> : null;
    case 'inputRequest':
      return 'request' in part ? <InputRequest request={part.request} send={send} live={live} response={'response' in part && part.response !== undefined ? String(part.response) : undefined} /> : null;
    case 'error':
      return <Alert tone="danger" message={'error' in part && part.error.message !== '' ? part.error.message : t('sessions/tool/agentError')} />;
    case 'systemNotification':
      return <p className="web-note">{'content' in part ? textOf(part.content as string) : ''}</p>;
    default:
      return null;
  }
});
