/**
 * Examples to start an automation from: one JSON file per template plus an
 * index, the same files ahpapp ships in `src/automation-templates/`. A template
 * fills the title, the message and the schedule of a new automation's draft.
 */

import { toMonochromeEmoji } from '../emojis.js';
import index from './templates/index.json';
import commitPr from './templates/commit-pr.json';
import reviewCommits from './templates/review-commits.json';
import nightlyTriage from './templates/nightly-triage.json';
import weekendBugs from './templates/weekend-bugs.json';
import issueTriage from './templates/issue-triage.json';
import dependencyUpdates from './templates/dependency-updates.json';
import securityAudit from './templates/security-audit.json';
import flakyTests from './templates/flaky-tests.json';
import releaseNotes from './templates/release-notes.json';
import releaseCheck from './templates/release-check.json';
import todoSweep from './templates/todo-sweep.json';
import docsDrift from './templates/docs-drift.json';
import mondayPlan from './templates/monday-plan.json';
import morningBrief from './templates/morning-brief.json';
import downloadsTidy from './templates/downloads-tidy.json';
import receipts from './templates/receipts.json';
import weeklyReview from './templates/weekly-review.json';
import readingDigest from './templates/reading-digest.json';
import backupCheck from './templates/backup-check.json';
import photoOrganize from './templates/photo-organize.json';

/** Every template file, by the name the index gives it. */
const FILES: Record<string, unknown> = {
  'commit-pr.json': commitPr,
  'review-commits.json': reviewCommits,
  'nightly-triage.json': nightlyTriage,
  'weekend-bugs.json': weekendBugs,
  'issue-triage.json': issueTriage,
  'dependency-updates.json': dependencyUpdates,
  'security-audit.json': securityAudit,
  'flaky-tests.json': flakyTests,
  'release-notes.json': releaseNotes,
  'release-check.json': releaseCheck,
  'todo-sweep.json': todoSweep,
  'docs-drift.json': docsDrift,
  'monday-plan.json': mondayPlan,
  'morning-brief.json': morningBrief,
  'downloads-tidy.json': downloadsTidy,
  'receipts.json': receipts,
  'weekly-review.json': weeklyReview,
  'reading-digest.json': readingDigest,
  'backup-check.json': backupCheck,
  'photo-organize.json': photoOrganize,
};

/** The emoji drawn for each icon a file names, which is an ahpapp icon font's `Family:name`. */
const EMOJI: Record<string, string> = {
  'Ionicons:cloud-done': '☁',
  'Ionicons:git-pull-request': '🔀',
  'Ionicons:cube': '📦',
  'Ionicons:book': '📖',
  'Ionicons:folder-open': '📂',
  'Ionicons:shuffle': '🔀',
  'Ionicons:pricetags': '🏷',
  'Ionicons:calendar': '📅',
  'Ionicons:sunny': '☀',
  'Ionicons:moon': '🌙',
  'Ionicons:images': '🖼',
  'Ionicons:newspaper': '📰',
  'Ionicons:receipt': '🧾',
  'Ionicons:rocket': '🚀',
  'Ionicons:megaphone': '📣',
  'Ionicons:eye': '👁',
  'Ionicons:shield-checkmark': '🛡',
  'Ionicons:list': '📋',
  'Ionicons:bug': '🐛',
  'Ionicons:journal': '📓',
};

/** The emoji for an icon the table does not name. */
const FALLBACK_EMOJI = '✨';

/** Who a template is for, which is how the list groups them. */
export type TemplateGroup = 'code' | 'everyday';

export interface AutomationTemplate {
  id: string;
  emoji: string;
  group: TemplateGroup;
  title: string;
  prompt: string;
  /** A five-field cron expression. */
  expression: string;
}

const text = (value: unknown): string | null => (typeof value === 'string' && value.trim() !== '' ? value.trim() : null);

const record = (value: unknown): Record<string, unknown> | null =>
  typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

/** A field that is one string or one per language: `lang`, else English, else any. */
function localized(value: unknown, lang: string): string | null {
  const plain = text(value);
  if (plain !== null) return plain;
  const byLang = record(value);
  if (byLang === null) return null;
  return text(byLang[lang]) ?? text(byLang['en']) ?? Object.values(byLang).map(text).find((one) => one !== null) ?? null;
}

/** The language a file names for ahpw's locale: the files say `es` where ahpw says `es-419`. */
const fileLang = (locale: string): string => (locale.startsWith('es') ? 'es' : locale);

/** The templates in the index's order, in `locale`; a file that is missing or incomplete is left out. */
export function readTemplates(indexFile: unknown, files: Record<string, unknown>, locale: string): AutomationTemplate[] {
  const lang = fileLang(locale);
  const list = record(indexFile)?.['templates'];
  if (!Array.isArray(list)) return [];
  return list.flatMap((entry): AutomationTemplate[] => {
    const id = text(record(entry)?.['id']);
    const file = text(record(entry)?.['file']);
    const held = file === null ? null : record(files[file]);
    if (id === null || held === null) return [];
    const title = localized(held['title'], lang);
    const prompt = localized(held['prompt'], lang);
    const expression = text(held['time']);
    if (title === null || prompt === null || expression === null || expression.split(/\s+/).length !== 5) return [];
    const icon = text(held['icon']) ?? '';
    return [{
      id,
      emoji: toMonochromeEmoji(EMOJI[icon] ?? FALLBACK_EMOJI),
      group: held['group'] === 'everyday' ? 'everyday' : 'code',
      title,
      prompt,
      expression: expression.split(/\s+/).join(' '),
    }];
  });
}

/** The templates ahpw ships, in `locale`. */
export function templatesIn(locale: string): AutomationTemplate[] {
  return readTemplates(index, FILES, locale);
}
