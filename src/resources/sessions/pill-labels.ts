import { translate } from '@softov/scena';
import { EMOJIcon } from '../emojis.js';
import { optionLabel, type Option } from './composer-commands.js';

/** A footer pill's three labels, as `Pill` takes them: wide, narrower, and its icon alone in a narrow box. */
export interface PillLabels {
  label: string;
  short: string;
  icon: string;
}

/** The key ahpd's backends send Approvals under. */
export const APPROVALS_KEY = 'permissionMode';

/** Whether a setting is Approvals, which the new session box draws after the agent picker. */
export const isApprovals = (option: Option): boolean => option.key === APPROVALS_KEY;

/** The icon a setting's pill keeps in a narrow box. */
export function settingIcon(key: string): string {
  if (key === APPROVALS_KEY) return EMOJIcon.approvals;
  if (key === 'effortLevel') return EMOJIcon.thinking;
  return EMOJIcon.settings;
}

/** A setting's pill: "Approvals: Ask Before Edits", "Ask Before Edits", its icon. */
export function settingLabels(option: Option): PillLabels {
  const value = optionLabel(option);
  return { label: translate('sessions/pills/setting', { name: option.schema.title || option.key, value }), short: value, icon: settingIcon(option.key) };
}

/** The model's pill: "Model: Opus", "Opus", the model glyph. */
export const modelLabels = (name: string): PillLabels => ({ label: translate('sessions/pills/model', { name }), short: name, icon: EMOJIcon.model });
