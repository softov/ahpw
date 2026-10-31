import { describe, expect, it, vi } from 'vitest';
import { createScena } from '@softov/scena/core';
import { CUSTOM_FILE_OPENS, customFileTemplate, customFileTitle, customFileUri, openCustomFile } from './custom-files.js';

const spot = { uri: 'file:///home/ana/.claude/agents/review.md', line: null };

describe('openCustomFile', () => {
  it('opens the file as a tab in the text editor by default', () => {
    const scena = createScena();
    const execute = vi.spyOn(scena.commands, 'execute').mockResolvedValue(undefined);
    const showModal = vi.fn();
    openCustomFile(scena, 'dev1', spot, showModal);
    expect(execute).toHaveBeenCalledWith('ahp.openFile', { host: 'dev1', uri: spot.uri, line: null, viewer: 'FilePage' });
    expect(showModal).not.toHaveBeenCalled();
  });

  it('shows the file in a modal when the setting says so', () => {
    const scena = createScena();
    const execute = vi.spyOn(scena.commands, 'execute').mockResolvedValue(undefined);
    scena.store.set(CUSTOM_FILE_OPENS.path, 'modal');
    const showModal = vi.fn();
    openCustomFile(scena, 'dev1', spot, showModal);
    expect(showModal).toHaveBeenCalledWith(spot);
    expect(execute).not.toHaveBeenCalled();
  });
});

describe('customFileUri', () => {
  it('puts an agent in `<name>.md` and a skill in `<name>/SKILL.md`', () => {
    expect(customFileUri('file:///home/ana/.claude/agents', 'agent', 'review')).toBe('file:///home/ana/.claude/agents/review.md');
    expect(customFileUri('file:///home/ana/.claude/agents/', 'agent', ' review.md ')).toBe('file:///home/ana/.claude/agents/review.md');
    expect(customFileUri('file:///home/ana/.claude/skills', 'skill', 'deploy')).toBe('file:///home/ana/.claude/skills/deploy/SKILL.md');
  });
});

describe('customFileTemplate', () => {
  it('names the file in its frontmatter', () => {
    expect(customFileTemplate('agent', 'review.md')).toMatch(/^---\nname: review\ndescription: .+\n---\n/);
    expect(customFileTemplate('skill', 'deploy')).toMatch(/^---\nname: deploy\ndescription: .+\n---\n\n# deploy\n/);
  });
});

describe('customFileTitle', () => {
  it('calls a skill by its folder and an agent by its file', () => {
    expect(customFileTitle('file:///home/ana/.claude/skills/deploy/SKILL.md')).toBe('deploy');
    expect(customFileTitle('file:///home/ana/.claude/agents/review.md')).toBe('review');
  });
});
