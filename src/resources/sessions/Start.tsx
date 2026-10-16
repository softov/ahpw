import type { ReactElement } from 'react';
import { useI18n, useScena } from '@softov/scena/react';
import { Button } from '@softov/scena/ui';
import { AhpwMark } from '../../shell/AhpwMark.js';
import './start.css';

/** What `main` shows with nothing open: the mark and the way to start (scena's `surfaces.setEmpty`). */
export default function StartPage(): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  return (
    <div className="web-start">
      <AhpwMark size={72} />
      <p className="web-note">{t('sessions/start/note')}</p>
      <Button label={t('sessions/commands/newSession')} variant="primary" onClick={() => void scena.commands.execute('ahp.newSession')} />
    </div>
  );
}
