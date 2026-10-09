import { memo, useContext, useState, type MouseEvent, type ReactElement } from 'react';
import { useScena } from '@softov/scena/react';
import { Alert, Button, Markdown } from '@softov/scena/ui';
import type {
  ResponsePart,
  StateAction,
  ToolCallState,
} from '@microsoft/agent-host-protocol';
import { elapsed, folderLabel, textOf } from '../connection/words.js';
import { codePath, fileLink } from '../files/link.js';
import { linkClicks } from '../files/clicks.js';
import { WorkspaceContext } from './workspace.js';
import { InputRequest } from './Question.js';
import { durationOf, fileOf, inputText, kindOf, lineOf, outcomeOf, outputOf, segmentsOf, type Outcome, type Output, type ToolKind } from './tool.js';
import { EMOJIcon } from '../emojis.js';

/** Sends one action on the chat this transcript shows. */
export type Send = (action: StateAction) => void;

/** Tool call statuses, as their wire values: the enum is ambient and `const`. */
const PENDING_CONFIRMATION = 'pending-confirmation';
const PENDING_RESULT_CONFIRMATION = 'pending-result-confirmation';

/** The mark a call carries collapsed, and the word behind it. */
const MARK: Record<Outcome, { glyph: string; label: string }> = {
  preparing: { glyph: EMOJIcon.pending, label: 'Preparing' },
  approval: { glyph: EMOJIcon.waiting, label: 'Needs approval' },
  running: { glyph: EMOJIcon.running, label: 'Running' },
  'sign-in': { glyph: EMOJIcon.waiting, label: 'Needs sign-in' },
  review: { glyph: EMOJIcon.waiting, label: 'Review result' },
  done: { glyph: EMOJIcon.check, label: 'Done' },
  failed: { glyph: EMOJIcon.cross, label: 'Failed' },
  cancelled: { glyph: EMOJIcon.cross, label: 'Cancelled' },
};

/** Clicks inside an agent's text, relative paths from the session's folder. */
function useLinkClicks(): (event: MouseEvent<HTMLElement>) => void {
  return linkClicks(useScena(), useContext(WorkspaceContext));
}

/** The icon of each kind of call. */
const KIND_ICON: Record<ToolKind, string> = {
  terminal: EMOJIcon.terminal,
  read: EMOJIcon.read,
  search: EMOJIcon.search,
  edit: EMOJIcon.edit,
  subagent: EMOJIcon.subagent,
  web: EMOJIcon.web,
  other: EMOJIcon.dot,
};

/** A call's line, each file it names a link that opens the file and leaves the row closed. */
function ToolLine({ line, file }: { line: string; file: string | undefined }): ReactElement {
  const scena = useScena();
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
            title={`Open ${folderLabel(target.uri)}`}
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
function Block({ title, text }: { title: string; text: string }): ReactElement {
  const [copied, setCopied] = useState(false);
  const copy = (): void => {
    void navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    }).catch(() => undefined);
  };
  return (
    <section className="web-tool__block">
      <div className="web-tool__block-head">
        <span>{title}</span>
        <button type="button" className="web-tool__copy" onClick={copy}>{copied ? 'Copied' : 'Copy'}</button>
      </div>
      <pre className="web-tool__pre">{text}</pre>
    </section>
  );
}

function OutputView({ out }: { out: Output }): ReactElement {
  const scena = useScena();
  switch (out.kind) {
    case 'text':
      return <Block title="Output" text={out.text} />;
    case 'terminal':
      return (
        <Block
          title={`${out.title}${out.exitCode === undefined ? '' : ` \u{00B7} exit ${out.exitCode}`}${out.truncated ? ' \u{00B7} cut short' : ''}`}
          text={out.text === '' ? 'No output.' : out.text}
        />
      );
    case 'file':
      return (
        <p className="web-tool__file">
          <button
            type="button"
            className="web-link"
            title={out.before === undefined && out.after === undefined ? 'Open the file' : 'Open the change'}
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
  return (
    <div className="web-tool" data-outcome={outcome}>
      <button type="button" className="web-tool__row" aria-expanded={shown} title={MARK[outcome].label} onClick={() => setOpen(!open)}>
        <span className="web-tool__mark" aria-label={MARK[outcome].label}>{KIND_ICON[kindOf(call)]}</span>
        <ToolLine line={lineOf(call)} file={file} />
        {outcome === 'failed' || outcome === 'cancelled' ? <span className="web-tool__state">{MARK[outcome].label}</span> : null}
        {duration === undefined || duration < 1000 ? null : <span className="web-tool__time">{elapsed(duration)}</span>}
      </button>
      {shown ? (
        <div className="web-tool__body">
          <dl className="web-tool__facts">
            <dt>Tool</dt><dd><code>{call.toolName}</code>{name === call.toolName ? null : ` (${name})`}</dd>
            <dt>Status</dt><dd>{MARK[outcome].label}</dd>
            {file === undefined ? null : (
              <><dt>File</dt><dd><button type="button" className="web-link" onClick={() => void scena.commands.execute('ahp.openFile', { uri: file })}>{folderLabel(file)}</button></dd></>
            )}
            {call.intention === undefined ? null : <><dt>Why</dt><dd>{call.intention}</dd></>}
            {risk === undefined || risk.status !== 'complete' ? null : <><dt>Risk</dt><dd>{`${risk.safety}/10 safe \u{00B7} ${risk.reason}`}</dd></>}
          </dl>
          {input === '' ? null : <Block title="Arguments" text={input} />}
          {output.map((one, index) => <OutputView key={index} out={one} />)}
          {live && call.status === PENDING_CONFIRMATION ? <Confirm call={call} send={send} turnId={turnId} /> : null}
          {live && call.status === PENDING_RESULT_CONFIRMATION ? (
            <div className="web-tool__actions">
              <Button label="Accept result" variant="primary" onClick={() => send({ type: 'chat/toolCallResultConfirmed', turnId, toolCallId: call.toolCallId, approved: true } as StateAction)} />
              <Button label="Reject" onClick={() => send({ type: 'chat/toolCallResultConfirmed', turnId, toolCallId: call.toolCallId, approved: false } as StateAction)} />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** One stretch of thinking: its opening words on the line, opened to the whole text. */
export function Reasoning({ text, running }: { text: string; running: boolean }): ReactElement {
  const [open, setOpen] = useState(false);
  const opening = text.replace(/[*_`#>]/g, '').replace(/\s+/g, ' ').trim();
  return (
    <div className="web-tool" data-outcome={running ? 'running' : 'thought'}>
      <button type="button" className="web-tool__row" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="web-tool__mark" aria-hidden="true">{EMOJIcon.thinking}</span>
        <span className="web-tool__line">Thinking: {opening}</span>
      </button>
      {open ? <div className="web-tool__body web-md"><Markdown text={text} /></div> : null}
    </div>
  );
}

/** The host's options for a call awaiting approval, or approve and deny when it offers none. */
function Confirm({ call, send, turnId }: { call: ToolCallState; send: Send; turnId: string }): ReactElement {
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
            <Button label="Approve" variant="primary" onClick={() => approve()} />
            <Button label="Deny" onClick={() => deny()} />
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
      return <Alert tone="danger" message={'error' in part && part.error.message !== '' ? part.error.message : 'The agent reported an error.'} />;
    case 'systemNotification':
      return <p className="web-note">{'content' in part ? textOf(part.content as string) : ''}</p>;
    default:
      return null;
  }
});
