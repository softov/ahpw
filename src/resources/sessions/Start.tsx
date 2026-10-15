import type { ReactElement } from 'react';
import { useScena } from '@softov/scena/react';
import { Button } from '@softov/scena/ui';
import { AhpwMark } from '../../shell/AhpwMark.js';
import './start.css';

/** What `main` shows with nothing open: the mark and the way to start (scena's `surfaces.setEmpty`). */
export default function StartPage(): ReactElement {
  const scena = useScena();
  return (
    <div className="web-start">
      <AhpwMark size={72} />
      <p className="web-note">Start a session, or open one from the list.</p>
      <Button label="New session" variant="primary" onClick={() => void scena.commands.execute('ahp.newSession')} />
    </div>
  );
}
