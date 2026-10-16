import { describe, expect, it } from 'vitest';
import { createScena } from '@softov/scena/core';
import { registerShellCommands } from './commands.js';

const left = (scena: ReturnType<typeof createScena>) => scena.layout.get().surfaces['sidebar:left'];

describe('sidebar.activate', () => {
  it('from an activity item (toggle), the section already showing closes the sidebar, as in VS Code', async () => {
    const scena = createScena();
    registerShellCommands(scena);
    scena.layout.setSurface('sidebar:left', { visible: false, section: 'sessions' });

    await scena.commands.execute('sidebar.activate', { section: 'sessions', toggle: true });
    expect(left(scena)).toMatchObject({ visible: true, section: 'sessions' });

    await scena.commands.execute('sidebar.activate', { section: 'sessions', toggle: true });
    expect(left(scena)?.visible).toBe(false);

    // Another section, while one shows, switches to it rather than closing.
    await scena.commands.execute('sidebar.activate', { section: 'sessions', toggle: true });
    await scena.commands.execute('sidebar.activate', { section: 'folders', toggle: true });
    expect(left(scena)).toMatchObject({ visible: true, section: 'folders' });
  });

  it('from anything else (a palette command), the section showing stays shown', async () => {
    const scena = createScena();
    registerShellCommands(scena);
    scena.layout.setSurface('sidebar:left', { visible: true, section: 'sessions' });

    await scena.commands.execute('sidebar.activate', { section: 'sessions' });
    expect(left(scena)).toMatchObject({ visible: true, section: 'sessions' });
  });
});
