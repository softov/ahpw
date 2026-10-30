import type { BindingPath } from '@softov/scena/types';
import { chatChoice } from '../sessions/view-settings.js';

/** Where a bot chat opens, as `ui.botChatOpens` sets it: `ask` asks on the next open and keeps the answer. */
export const BOT_CHAT_OPENS = chatChoice('$/ahp/bots/chatOpens' as BindingPath, 'ahpw.botChatOpens', ['ask', 'main', 'right'], 'ask');

/** Where a session tab opens: `main`, or the right sidebar. */
export type ChatPlace = 'main' | 'right';
