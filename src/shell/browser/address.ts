/** A scheme at the start of the text, as `https://` or `javascript:`. */
const SCHEME = /^([a-z][a-z0-9+.-]*):/i;

/** Schemes a person may type that are not a web page. */
const REFUSED = new Set(['javascript', 'data', 'file', 'blob', 'about', 'vbscript', 'mailto', 'tel', 'chrome', 'view-source']);

/** A host on this machine, which a dev server serves over plain http. */
const LOOPBACK = /^(localhost|127(\.\d{1,3}){3}|\[::1\])(:\d+)?([/?#]|$)/i;

/**
 * The address the Browser view opens for what a person typed, or null when it
 * is empty or not an http or https page. A bare host gets `https://`, and a
 * host on this machine gets `http://`.
 */
export function addressOf(text: string): string | null {
  const typed = text.trim();
  if (typed === '' || /\s/.test(typed)) return null;
  const scheme = SCHEME.exec(typed)?.[1]?.toLowerCase();
  // `localhost:5173` reads as a scheme; only a known one or a `//` after it is one.
  const full = scheme !== undefined && (REFUSED.has(scheme) || typed.slice(scheme.length + 1).startsWith('//'));
  if (full && scheme !== 'http' && scheme !== 'https') return null;
  const whole = full ? typed : `${LOOPBACK.test(typed) ? 'http' : 'https'}://${typed}`;
  try {
    const url = new URL(whole);
    return url.hostname === '' ? null : url.href;
  } catch {
    return null;
  }
}
