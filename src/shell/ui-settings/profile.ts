import type { Disposable, Scena } from '@softov/scena/types';
import { translate } from '@softov/scena';
import type { EmbedProfile } from '../embed/index.js';
import { failed } from '../notify/index.js';
import { isUiKey, readUi, watchUi, writeUi } from './settings.js';

/**
 * Keeps the UI settings in an embedder's profile (decision: UI settings are
 * kept by the browser, or by an embedder's profile when it gives one). The
 * profile is read once and wins; from then on every change writes the whole
 * list to it. The browser keeps its copy throughout, since each setting's
 * owner keeps it there, so the first paint never waits for the profile.
 */
export function registerProfile(scena: Scena, profile: EmbedProfile | undefined): Disposable {
  if (profile === undefined) return { dispose: () => {} };
  let live = true;
  // Until the profile is read, a change is the page starting, not a choice to save over it.
  let read = false;
  // Several settings changing together, as a profile applied or a theme with its mode, write once.
  let queued = false;
  const save = (): void => {
    if (!live || !read || queued) return;
    queued = true;
    setTimeout(() => {
      queued = false;
      if (!live) return;
      profile.write(readUi(scena)).catch((error: unknown) => failed(translate('host/settings/ui/profileUnsaved'), error));
    }, 0);
  };
  const watching = watchUi(scena, save);
  profile.read().then(
    (held) => {
      if (!live) return;
      for (const [key, value] of Object.entries(held ?? {})) {
        if (isUiKey(key)) writeUi(scena, key, value);
      }
      read = true;
      // A profile that held nothing, or not every setting, gets the browser's choices.
      save();
    },
    (error: unknown) => failed(translate('host/settings/ui/profileUnread'), error),
  );
  return { dispose: () => { live = false; watching.dispose(); } };
}
