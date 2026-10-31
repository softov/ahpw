import { translate } from '@softov/scena';
import { mayForce, restartHost } from '../../bridges/restart.js';
import { confirm } from '../../shell/notify/index.js';
import { done, failed } from '../../shell/notify/say.js';

/** The command that restarts a host, from the palette, the host page and the restart notes. */
export const RESTART_HOST = 'ahp.restartHost';

/** Arguments of `ahp.restartHost`: the host, and whether to restart it while a turn is running. */
export interface RestartArgs {
  host?: string;
  force?: boolean;
}

/**
 * Asks first, then restarts the host and says so; "Restart anyway" is the
 * answer to a refusal, so it does not ask again. A refusal is the host's, in its words, with
 * "Restart anyway" when forcing could change it; the bridge connects again on
 * its own once the host is back.
 */
export async function restartWithNotice(host: string, force = false): Promise<void> {
  if (!force && !(await confirm({ title: translate('host/restart/confirm'), body: translate('host/restart/note'), confirmLabel: translate('host/restart/button'), tone: 'danger' }))) return;
  try {
    await restartHost(host, force);
    done(translate('host/restart/done'));
  } catch (error) {
    const actions = force || !mayForce(error) ? [] : [{ label: translate('host/restart/anyway'), command: RESTART_HOST, args: { host, force: true } satisfies RestartArgs }];
    failed(translate('host/restart/failed'), error, actions.length === 0 ? {} : { actions, dismissAuto: false });
  }
}
