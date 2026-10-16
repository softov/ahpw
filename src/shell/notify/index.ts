import type { Disposable, Scena } from '@softov/scena/types';
import { combineDisposables, translate } from '@softov/scena';
import { english } from '../../i18n/locales.js';
import { initNotifications, resetNotifications } from './context.js';
import { DEFAULT_CONFIRM_STYLE, confirmStyle, initConfirm, resetConfirm, setConfirmStyle } from './confirm.js';
import { canAsk, createBrowserChannel, granted, requestAlerts } from './browser-channel.js';
import { ConfirmDialog } from './ConfirmDialog.js';
import { Toaster } from './Toaster.js';
import { DISMISS_SLOW_MS } from './types.js';
import { PALETTE_SLOT } from '../CommandPalette.js';

/** The notification registry, its toaster and browser channel, the confirm dialog, and their commands. */
export function registerNotifications(scena: Scena): Disposable {
  const notifications = initNotifications(scena.store);
  initConfirm(scena.store, DEFAULT_CONFIRM_STYLE);
  const browser = createBrowserChannel();

  return combineDisposables(
    { dispose: () => { browser.dispose(); resetConfirm(); resetNotifications(); } },
    scena.components.register({
      component: 'Notifications.Toaster',
      category: 'chrome',
      renderer: { kind: 'react', load: async () => ({ default: Toaster as unknown }) },
    }),
    scena.components.register({
      component: 'Notifications.Confirm',
      category: 'chrome',
      renderer: { kind: 'react', load: async () => ({ default: ConfirmDialog as unknown }) },
    }),
    // The toaster reads the list from the store; this says something shows it.
    notifications.channels.register({ id: 'toast', available: () => true, present: () => undefined }),
    notifications.channels.register(browser),
    scena.surfaces.mount({ surface: 'overlay', key: 'notifications:toaster', resource: { component: 'Notifications.Toaster' } }),
    scena.surfaces.mount({ surface: 'overlay', key: 'notifications:confirm', resource: { component: 'Notifications.Confirm' } }),

    scena.commands.register({
      id: 'notifications.enableAlerts',
      title: () => translate('shell/notify/commands/enableAlerts'),
      keywords: [english('shell/notify/commands/enableAlerts')],
      category: 'Notifications',
      slots: [PALETTE_SLOT],
      run: async () => {
        if (granted()) {
          notifications.publish({ type: 'default', tone: 'success', title: translate('shell/notify/alerts/alreadyOn') });
          return;
        }
        if (!canAsk()) {
          notifications.publish({
            type: 'default',
            tone: 'warning',
            title: translate('shell/notify/alerts/blocked'),
            description: translate('shell/notify/alerts/blockedHelp'),
            dismissTime: DISMISS_SLOW_MS,
          });
          return;
        }
        const answer = await requestAlerts();
        notifications.publish({
          type: 'default',
          tone: answer === 'granted' ? 'success' : 'warning',
          title: answer === 'granted' ? translate('shell/notify/alerts/on') : translate('shell/notify/alerts/notAllowed'),
        });
      },
    }),
    scena.commands.register({
      id: 'notifications.confirmStyle',
      title: () => (confirmStyle() === 'native' ? translate('shell/notify/commands/confirmModal') : translate('shell/notify/commands/confirmNative')),
      keywords: [english('shell/notify/commands/confirmModal'), english('shell/notify/commands/confirmNative')],
      category: 'Notifications',
      slots: [PALETTE_SLOT],
      run: () => setConfirmStyle(confirmStyle() === 'native' ? 'modal' : 'native'),
    }),
    scena.commands.register({
      id: 'notifications.dismissAll',
      title: () => translate('shell/notify/commands/dismissAll'),
      keywords: [english('shell/notify/commands/dismissAll')],
      category: 'Notifications',
      slots: [PALETTE_SLOT],
      run: () => {
        for (const entry of notifications.list()) notifications.dismiss(entry.id);
      },
    }),
  );
}

export { confirm } from './confirm.js';
export { done, failed, warn } from './say.js';
export { getNotifications, tryNotify } from './context.js';
