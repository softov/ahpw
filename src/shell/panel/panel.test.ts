import { describe, expect, it } from 'vitest';
import { createScena } from '@softov/scena/core';
import { onPanel, onPanelTab, registerPanel, registerPanelHide, STRIP_SLOT } from './index.js';

const visible = (scena: ReturnType<typeof createScena>): boolean => scena.layout.get().surfaces['panel:bottom']?.visible ?? false;

describe('panel', () => {
  it('opens with the log pinned first, though no terminal exists', async () => {
    const scena = createScena();
    registerPanel(scena);
    await scena.commands.execute('panel.toggle');
    expect(visible(scena)).toBe(true);
    expect(scena.surfaces.listAt('panel:bottom').map((one) => one.key)).toEqual(['panel:log']);
    expect(scena.layout.get().surfaces['panel:bottom']?.split?.pinned).toEqual(['panel:log']);
    await scena.commands.execute('panel.toggle');
    expect(visible(scena)).toBe(false);
  });

  it('puts its strip buttons on the panel only, hide last, clear on the log tab', () => {
    const scena = createScena();
    registerPanel(scena);
    registerPanelHide(scena);
    const buttons = scena.commands.list({ slot: STRIP_SLOT });
    expect(buttons.map((one) => one.id)).toEqual(['log.clear', 'panel.hide']);
    expect(onPanelTab('LogPage')({ '$/surface/name': 'panel:bottom', '$/tab/component': 'LogPage' })).toBe(true);
    expect(onPanelTab('LogPage')({ '$/surface/name': 'panel:bottom', '$/tab/component': 'TerminalPage' })).toBe(false);
    // An empty strip has no active tab.
    expect(onPanelTab('LogPage')({ '$/surface/name': 'panel:bottom', '$/tab/component': undefined })).toBe(false);
    expect(onPanelTab('LogPage')({})).toBe(true);
    expect(onPanel({ '$/surface/name': 'panel:bottom' })).toBe(true);
    expect(onPanel({ '$/surface/name': 'main' })).toBe(false);
    // The palette asks without a surface, and still runs it.
    expect(onPanel({})).toBe(true);
  });
});
