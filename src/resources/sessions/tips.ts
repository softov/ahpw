/** One tip under the new session box: the keys to press, and what they do. */
export interface Tip {
  keys: string;
  /** The key of the message that says what they do. */
  message: string;
  /** Shown only when the chosen agent has skills or commands to list. */
  needsCommands?: boolean;
}

/** The new session box's tips, one per open. No Alt+Enter: nothing runs yet to steer. */
export const NEW_TIPS: readonly Tip[] = [
  { keys: '/', message: 'sessions/tips/slash', needsCommands: true },
  { keys: '@', message: 'sessions/tips/mention' },
  { keys: '+', message: 'sessions/tips/add' },
  { keys: 'Enter', message: 'sessions/tips/enter' },
  { keys: 'Shift+Enter', message: 'sessions/tips/shiftEnter' },
];

/** The tips that apply to an agent with or without commands. */
export const tipsFor = (hasCommands: boolean): Tip[] => NEW_TIPS.filter((one) => hasCommands || one.needsCommands !== true);

/** The tip for the `count`th open, round and round the list. */
export const tipAt = (tips: readonly Tip[], count: number): Tip => tips[count % tips.length]!;

/** Where the count of opens is kept: a tip belongs to no host, so the key has none. */
export const TIP_KEY = 'ahpd-web.new-tip';

/** How many times the new session box has opened; 0 when storage is blocked or holds something else. */
export function readTipCount(): number {
  try {
    const held = Number(window.localStorage.getItem(TIP_KEY));
    return Number.isInteger(held) && held >= 0 ? held : 0;
  } catch {
    return 0;
  }
}

export function writeTipCount(count: number): void {
  try {
    window.localStorage.setItem(TIP_KEY, String(count));
  } catch {
    // Storage blocked: the same tip shows each time.
  }
}
