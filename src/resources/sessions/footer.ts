import type { SessionModelInfo, UsageInfo } from '@microsoft/agent-host-protocol';
import { getLocale, translate } from '@softov/scena';
import type { Option } from './composer-commands.js';
import { tokens } from './turn.js';

/**
 * Which side of the footer a setting sits on: one that holds for a chat, as
 * effort, beside the model on the right; one for the whole session, as
 * approvals, on the left. AHP 1.0.0 does not type `scope`; ahpd's backends send it.
 */
export function footerSide(option: Option): 'left' | 'right' {
  return (option.schema as { scope?: unknown }).scope === 'chat' ? 'right' : 'left';
}

/**
 * The context size beside the model: the last turn's input over the model's
 * window, as `12k / 200k`, or the window alone before a turn. Nothing when
 * the host does not give the model's window.
 */
export function contextReadout(model: SessionModelInfo | undefined, usage: UsageInfo | undefined): { text: string; title: string } | null {
  const window = model?.maxContextWindow;
  if (window === undefined) return null;
  const words = (count: number): string => count.toLocaleString(getLocale());
  if (usage?.inputTokens === undefined) return { text: tokens(window), title: translate('sessions/footer/window', { window: words(window) }) };
  const used = usage.inputTokens + (usage.cacheReadTokens ?? 0);
  return { text: `${tokens(used)} / ${tokens(window)}`, title: translate('sessions/footer/used', { used: words(used), window: words(window) }) };
}
