import { useEffect, useMemo, useRef, useState, type ReactElement, type ReactNode } from 'react';
import type { Disposable, Scena, ScopeBackendFactory } from '@softov/scena/types';
import { createI18nBackend, createLocalStorageLayoutStorage, createModusBackend, registerLayoutCommands } from '@softov/scena';
import { DEFAULT_SURFACE_LAYOUTS } from '@softov/scena/core';
import { Scena as ScenaRoot, useScena } from '@softov/scena/react/core';
import { DefaultShell, useI18n } from '@softov/scena/react';
import { Limen, PortaContextProvider, SIGILLUM_PATHS, createPorta, registerPortaBlocks, useSession } from '@softov/scena/porta';
import { registerBuiltins, registerBuiltinLayouts } from '@softov/scena/ui/builtins';
import { AhpwMark } from './shell/AhpwMark.js';
import { PRESENTATION } from './shell/presentation.js';
import { registerShell } from './shell/register-shell.js';
import { hostKey } from './lib/storage-keys.js';
import { keepTabs } from './shell/tabs.js';
import { SIGNED_IN, TOKEN_PROVIDER_ID, restoreSession, tokenProvider } from './porta/token-provider.js';
// Registers the languages before the first paint.
import './i18n/messages.js';

// v2: each tab names its host; a v1 layout's tabs do not, so it is not restored.
const layoutStorage = createLocalStorageLayoutStorage({ key: hostKey('ahpd-web.layout.v2') });

const backendFactories: ScopeBackendFactory[] = [
  { scope: 'modus', create: () => createModusBackend() },
  // `$/t/<key>`: the message in the chosen language.
  { scope: 't', create: () => createI18nBackend() },
];

/** scena's surfaces, with the right sidebar open, its panes as tabs: the open session's details and its changes. */
const surfaceDefaults = { ...DEFAULT_SURFACE_LAYOUTS, 'sidebar:right': { visible: true, layout: 'tab', size: 300 } };

// Module scope: a new object per render would re-initialise scena.
const options = { layoutStorage, backendFactories, surfaceDefaults };

/**
 * Sign-in, and the shell for as long as a session lasts.
 *
 * The shell is registered after sign-in because its providers call the API
 * with the token; it is disposed on sign-out with everything it put in the store.
 */
function PortaBridge({ children }: { children: ReactNode }): ReactElement {
  const scena = useScena();
  const session = useSession();
  const porta = useMemo(() => createPorta(scena, { providers: [tokenProvider()] }), [scena]);
  const restored = useRef(false);
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    const sub = registerPortaBlocks(scena);
    return () => sub.dispose();
  }, [scena]);

  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    void (async () => {
      const recovered = await restoreSession();
      if (recovered !== null) scena.store.set(SIGILLUM_PATHS.session, { ...recovered, _providerId: TOKEN_PROVIDER_ID });
      setRestoring(false);
    })();
  }, [scena]);

  useEffect(() => {
    if (session === null || session === undefined) return;
    let shell: Disposable | undefined;
    let tabs: Disposable | null = null;
    let live = true;
    try {
      shell = registerShell(scena);
      void keepTabs(scena, () => live).then((kept) => {
        if (live) tabs = kept;
        else kept?.dispose();
      });
    } catch (error) {
      console.error('[ahpd-web] registerShell failed:', error);
    }
    return () => {
      live = false;
      tabs?.dispose();
      scena.setSessionStorage(null);
      shell?.dispose();
    };
  }, [session, scena]);

  return <PortaContextProvider porta={porta}>{restoring ? <div className="web-loading" role="status" aria-label="Loading ahpw"><AhpwMark size={72} echo /></div> : children}</PortaContextProvider>;
}

/** The sign-in page's line, in the chosen language; its own component so App never re-renders on a language switch. */
function SignInNote(): ReactElement {
  const { t } = useI18n();
  return <>{t('auth/subtitle')}</>;
}

export default function App(): ReactElement {
  function onRender(scena: Scena): void {
    registerLayoutCommands(scena);
    registerBuiltins(scena);
    registerBuiltinLayouts(scena);
  }

  return (
    <ScenaRoot options={options} onRender={onRender}>
      <PortaBridge>
        <Limen permission={SIGNED_IN} title={<AhpwMark size={48} label="ahpw" set />} subtitle={<SignInNote />}>
          <DefaultShell presentation={PRESENTATION} />
        </Limen>
      </PortaBridge>
    </ScenaRoot>
  );
}
