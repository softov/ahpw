/**
 * What an app that embeds ahpw gives it, as `globalThis.ahpwEmbedder`.
 *
 * ahpw owns this contract and only reads it; the embedder (ahp-desk, or any
 * other app) sets the object before ahpw's own scripts run. Without one, ahpw
 * is a page in a browser and reads its host from the address bar. Nothing
 * here imports anything, so an embedder can depend on the types alone, from
 * `@ahpd/web/embed`.
 */

/** One host the embedder knows. A token is never part of it; ask `token()`. */
export interface EmbedHost {
  id: string;
  name: string;
  /** The host's WebSocket address, as `ws://127.0.0.1:9187`. */
  url: string;
}

/** A host's state, as the embedder sees it. */
export type EmbedHostStatus = 'connected' | 'connecting' | 'down';

/** Stops a subscription; safe to call more than once. */
export type Unsubscribe = () => void;

/** The window ahpw is in, when the embedder draws no frame and ahpw draws its own title bar. */
export interface EmbedWindow {
  minimize(): Promise<void>;
  toggleMaximize(): Promise<void>;
  close(): Promise<void>;
  /** Called on a press in the title bar, so a drag moves the window. */
  startDragging(): Promise<void>;
  /** Whether the window fills the screen, so ahpw squares its corners. */
  isMaximized(): Promise<boolean>;
  /** Calls `handler` on each resize, a maximize and a restore among them. */
  onResized(handler: () => void): Unsubscribe;
}

/**
 * Where the embedder keeps the person's UI settings, as a profile: one object
 * keyed by setting, `{ "ui.theme": "default", "ui.language": "pt-BR" }`.
 * ahpw reads it once at start and writes it whole on every change; keys it
 * does not know are the embedder's to keep or drop.
 */
export interface EmbedProfile {
  /** What was saved, or null when nothing was. */
  read(): Promise<Record<string, unknown> | null>;
  /** Saves every setting, whole. */
  write(values: Record<string, unknown>): Promise<void>;
}

export interface Embedder {
  /**
   * Whether the window shows one host, `mono`, or every host the embedder
   * knows, `multi`. An embedder that gives none is a mono one.
   */
  readonly mode?: 'mono' | 'multi';
  /** The host this page shows; in multi, the host the window was opened on. */
  host(): Promise<EmbedHost>;
  /**
   * The address of the host this page shows, known before ahpw runs. Every host
   * shares the embedder's origin, so ahpw keeps a host's own pages under it.
   */
  readonly hostUrl: string;
  /** The token of the host `id`, else of the host this page shows, or null for a host with none. */
  token(id?: string): Promise<string | null>;
  /** Every host the embedder knows. */
  hosts(): Promise<EmbedHost[]>;
  /** Calls `handler` with the whole list each time a host is added, changed or removed. */
  onHosts(handler: (hosts: EmbedHost[]) => void): Unsubscribe;
  /** Every host's status by id; a host not yet seen is missing. */
  statuses(): Promise<Record<string, EmbedHostStatus>>;
  /** Calls `handler` with every host's status each time one changes. */
  onStatuses(handler: (statuses: Record<string, EmbedHostStatus>) => void): Unsubscribe;
  /** Moves this page to another host; the embedder reloads it. */
  switchHost(id: string): Promise<void>;
  /**
   * Shows the embedder's own place to add, edit and remove hosts; with `add`,
   * on its form for a new one, and with `edit`, on the form of that host.
   */
  manageHosts(options?: { add?: boolean; edit?: string }): Promise<void>;
  /** In multi, calls `handler` with a host's id each time the embedder asks the window to show that host. */
  onFocusHost?(handler: (id: string) => void): Unsubscribe;
  /** Present when ahpw draws the window's frame. */
  window?: EmbedWindow;
  /** Present when the embedder keeps the UI settings; without it, the browser alone keeps them. */
  profile?: EmbedProfile;
}

/** The embedder, or undefined in a browser. Read once: a page never moves between the two. */
export const embedder: Embedder | undefined = (globalThis as { ahpwEmbedder?: Embedder }).ahpwEmbedder;

/** Whether this window shows one host or every host; a browser shows one. */
export function embedMode(): 'mono' | 'multi' {
  return embedder?.mode ?? 'mono';
}
