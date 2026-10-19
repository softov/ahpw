import { useRef, useState, type ReactElement } from 'react';
import { useI18n } from '@softov/scena/react';
import { Button, Chip, type ChipState } from '@softov/scena/ui';
import { ContextMenu } from '@softov/scena/ui/menu';
import {
  dropSubject, EVERY, GRANT_GROUPS, groupOf, operationState, reached, splittable, subjectInfo, subjectsOf, toggleGroup, toggleOperation,
  type Grant, type GrantCatalog, type GrantGroup, type GrantSubject,
} from '../../bridges/grants.js';

interface RoleGrantsProps {
  grants: readonly string[];
  catalog: GrantCatalog;
  /** Subjects added from *Add subject* that no grant names yet. */
  shown: readonly string[];
  onChange: (grants: Grant[]) => void;
  onShow: (shown: string[]) => void;
  /** A host that takes no writes: the chips say, and do nothing. */
  readOnly: boolean;
}

/** A group switch's state: held itself, held through `<subject>:*` or a wildcard subject, or not. */
function groupState(grants: readonly string[], subject: string, group: GrantGroup | '*'): { state: ChipState; by?: string } {
  if (grants.includes(`${subject}:${group}`)) return { state: 'on' };
  const covering = [
    ...(group === '*' ? [] : [`${subject}:*`, `${EVERY}:${group}`]),
    `${EVERY}:*`,
  ].find((one) => one !== `${subject}:${group}` && grants.includes(one));
  return covering === undefined ? { state: 'off' } : { state: 'implied', by: covering };
}

/** One subject: its title, how much the role reaches, its groups' switch, and its operations as chips. */
function SubjectCard({ subject, info, known, grants, onChange, onDrop, readOnly }: {
  subject: string;
  info: GrantSubject;
  /** Whether the host advertises the subject; a plugin's that is not loaded is not. */
  known: boolean;
  grants: readonly string[];
  onChange: (grants: Grant[]) => void;
  onDrop: () => void;
  readOnly: boolean;
}): ReactElement {
  const { t } = useI18n();
  const [open, setOpen] = useState(true);
  const every = subject === EVERY;
  // Read, write, then any operation in neither group, as a subject the host does not advertise has; an empty row is left out.
  const rows = [
    ...GRANT_GROUPS.map((group) => ({ label: t(`users/role/groups/${group}`), operations: info.groups[group] })),
    { label: t('users/role/groups/other'), operations: info.operations.filter((one) => groupOf(info, one) === undefined) },
  ].filter((row) => row.operations.length > 0);
  const chipTitle = (operation: string): string => {
    const { state, by } = operationState(grants, subject, operation, info);
    if (state === 'on') return t('users/role/chip/granted', { grant: `${subject}:${operation}` });
    if (state === 'off') return t('users/role/chip/grant', { grant: `${subject}:${operation}` });
    return t(splittable(by!) ? 'users/role/chip/split' : 'users/role/chip/wildcard', { grant: by! });
  };
  return (
    <section className="web-grant" aria-label={every ? t('users/role/everySubject') : info.title}>
      <header className="web-grant__head">
        <button type="button" className="web-grant__fold" aria-expanded={open} onClick={() => setOpen(!open)}>
          <span aria-hidden="true">{open ? '\u{25BE}' : '\u{25B8}'}</span>
          <span className="web-grant__subject">{subject}</span>
          <span className="web-grant__title">
            {every
              ? t('users/role/everySubject')
              : known
                ? `${info.title} \u{00B7} ${t('users/role/reached', { n: reached(grants, subject, info), of: info.operations.length })}`
                : t('users/role/unknownSubject')}
          </span>
        </button>
        <span className="web-grant__groups">
          {([...GRANT_GROUPS, '*'] as const).map((group) => {
            const { state, by } = groupState(grants, subject, group);
            const word = group === '*' ? 'all' : group;
            return (
              <Chip
                key={group}
                label={word}
                state={state}
                disabled={readOnly}
                title={state === 'implied' ? t('users/role/chip/coveredBy', { grant: by! }) : t(`users/role/switch/${word}`, { grant: `${subject}:${group}` })}
                onClick={() => onChange(toggleGroup(grants, subject, group))}
              />
            );
          })}
        </span>
        {readOnly ? null : (
          <Button variant="ghost" size="xs" title={t('users/role/dropSubject', { subject })} onClick={onDrop}>
            {/* An icon-only button, named for a screen reader by its glyph's label. */}
            <span role="img" aria-label={t('users/role/dropSubject', { subject })}>{'\u{2715}'}</span>
          </Button>
        )}
      </header>
      {open ? (
        <div className="web-grant__body">
          {every ? <p className="web-note">{t('users/role/everySubjectHint')}</p> : info.description === '' ? null : <p className="web-note">{info.description}</p>}
          {every ? null : rows.map(({ label, operations }) => (
            <div key={label} className="web-grant__row">
              <span className="web-grant__label">{label}</span>
              <span className="web-grant__chips">
                {operations.map((operation) => {
                  const { state, by } = operationState(grants, subject, operation, info);
                  return (
                    <Chip
                      key={operation}
                      label={operation}
                      state={state}
                      title={chipTitle(operation)}
                      disabled={readOnly || (state === 'implied' && !splittable(by!))}
                      onClick={() => onChange(toggleOperation(grants, subject, operation, info))}
                    />
                  );
                })}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

/**
 * A role's grants as controls: what the three chip states mean, one card per
 * subject the role names, and *Add subject* for the others the host advertises
 * (decision: a role's grants are edited as cards from the host's catalog).
 */
export function RoleGrants({ grants, catalog, shown, onChange, onShow, readOnly }: RoleGrantsProps): ReactElement {
  const { t } = useI18n();
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  // scena's Button gives its click no event, so the menu opens under the box around it.
  const add = useRef<HTMLDivElement>(null);
  const subjects = subjectsOf(grants, catalog, shown);
  const addable = [EVERY, ...Object.keys(catalog)].filter((subject) => !subjects.includes(subject));
  return (
    <div className="web-grants">
      <div className="web-grants__legend" aria-hidden="true">
        {(['on', 'implied', 'off'] as const).map((state) => (
          <span key={state} className="oo-chip" data-state={state}>{t(`users/role/legend/${state}`)}</span>
        ))}
      </div>
      {subjects.length === 0 ? <p className="web-note">{t('users/role/noGrants')}</p> : null}
      {subjects.map((subject) => (
        <SubjectCard
          key={subject}
          subject={subject}
          info={subjectInfo(subject, catalog, grants)}
          known={Object.hasOwn(catalog, subject)}
          grants={grants}
          onChange={onChange}
          onDrop={() => {
            onShow(shown.filter((one) => one !== subject));
            onChange(dropSubject(grants, subject));
          }}
          readOnly={readOnly}
        />
      ))}
      {readOnly || addable.length === 0 ? null : (
        <div ref={add} className="web-grants__add">
          <Button
            label={`+ ${t('users/role/addSubject')}`}
            size="sm"
            onClick={() => {
              const box = add.current?.getBoundingClientRect();
              setMenu(menu === null && box !== undefined ? { x: box.left, y: box.bottom + 2 } : null);
            }}
          />
        </div>
      )}
      {menu === null ? null : (
        <ContextMenu
          spec={{
            items: addable.map((subject) => ({
              title: subject === EVERY ? `* \u{00B7} ${t('users/role/everySubject')}` : `${subject} \u{00B7} ${catalog[subject]?.title ?? subject}`,
              onSelect: (picker) => {
                picker.closeMenu();
                onShow([...shown, subject]);
              },
            })),
          }}
          x={menu.x}
          y={menu.y}
          onClose={() => setMenu(null)}
        />
      )}
    </div>
  );
}
