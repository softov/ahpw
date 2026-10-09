import { useEffect, useMemo, useRef, useState, type ReactElement, type ReactNode } from 'react';
import type { Disposable, Scena, ScopeBackendFactory } from '@softov/scena/types';
import { createLocalStorageLayoutStorage, createModusBackend, registerLayoutCommands } from '@softov/scena';
import { DEFAULT_SURFACE_LAYOUTS } from '@softov/scena/core';
import { Scena as ScenaRoot, useScena } from '@softov/scena/react/core';
import { DefaultShell } from '@softov/scena/react';
import { Limen, PortaContextProvider, SIGILLUM_PATHS, createPorta, registerPortaBlocks, useSession } from '@softov/scena/porta';
import { registerBuiltins, registerBuiltinLayouts } from '@softov/scena/ui/builtins';
import { AhpwMark } from './AhpwMark.js';
import { PRESENTATION } from './presentation.js';
import { registerShell } from './shell.js';
import { SIGNED_IN, TOKEN_PROVIDER_ID, restoreSession, tokenProvider } from './token-provider.js';

const layoutStorage = createLocalStorageLayoutStorage({ key: 'ahpd-web.layout.v1' });

const backendFactories: ScopeBackendFactory[] = [
  { scope: 'modus', create: () => createModusBackend() },
];

/** scena's surfaces, with the right sidebar open: it holds the open session's details. */
const surfaceDefaults = { ...DEFAULT_SURFACE_LAYOUTS, 'sidebar:right': { visible: true, layout: 'stack', size: 300 } };

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
    try {
      shell = registerShell(scena);
    } catch (error) {
      console.error('[ahpd-web] registerShell failed:', error);
    }
    return () => shell?.dispose();
  }, [session, scena]);

  return <PortaContextProvider porta={porta}>{restoring ? <div className="web-loading" role="status" aria-label="Loading ahpw"><AhpwMark size={72} echo /></div> : children}</PortaContextProvider>;
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
        <Limen permission={SIGNED_IN} title={<AhpwMark size={48} label="ahpw" set />} subtitle="Sign in with a token credential.">
          <DefaultShell presentation={PRESENTATION} />
        </Limen>
      </PortaBridge>
    </ScenaRoot>
  );
}
