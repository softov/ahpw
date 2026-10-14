import { describe, expect, it } from 'vitest';
import { EMOJIcon } from '../emojis.js';
import { modelLabels, settingIcon, settingLabels } from './pill-labels.js';

describe('settingLabels', () => {
  it('reads a choice wide, narrower, and as its icon', () => {
    const option = {
      key: 'permissionMode',
      schema: { type: 'string' as const, title: 'Approvals', enum: ['default', 'plan'], enumLabels: ['Ask Before Edits', 'Plan Mode'] },
      value: 'default',
    };
    expect(settingLabels(option)).toEqual({ label: 'Approvals: Ask Before Edits', short: 'Ask Before Edits', icon: EMOJIcon.approvals });
  });

  it('reads a switch as on or off', () => {
    expect(settingLabels({ key: 'fast', schema: { type: 'boolean', title: 'Fast' }, value: true }).short).toBe('on');
  });
});

describe('settingIcon', () => {
  it('gives effort its glyph and any other setting the settings glyph', () => {
    expect(settingIcon('effortLevel')).toBe(EMOJIcon.thinking);
    expect(settingIcon('isolation')).toBe(EMOJIcon.settings);
  });
});

describe('modelLabels', () => {
  it('reads the model wide, narrower, and as the model glyph', () => {
    expect(modelLabels('Opus')).toEqual({ label: 'Model: Opus', short: 'Opus', icon: EMOJIcon.model });
  });
});
