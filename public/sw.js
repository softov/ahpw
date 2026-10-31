/*
 * ahpw's service worker: it shows a host's push while no tab may be open, and
 * a click on one opens its session.
 *
 * It is registered once per host, at the scope `<base>/push/<host id>/`, so
 * the scope names the host a push came from. A push is ahpd's JSON
 * `{ title, body, data: { uri, kind } }`. Every push shows a notification:
 * Safari takes the permission back from a worker that shows none.
 */

const scope = new URL(self.registration.scope);
/** The folder ahpw is served from. */
const base = new URL('../../', scope);
/** The host this registration belongs to. */
const host = decodeURIComponent(scope.pathname.split('/').filter(Boolean).pop() ?? '');

self.addEventListener('push', (event) => {
  let message = {};
  try {
    message = event.data?.json() ?? {};
  } catch {
    message = { title: event.data?.text() ?? '' };
  }
  const uri = typeof message.data?.uri === 'string' ? message.data.uri : undefined;
  const title = typeof message.title === 'string' && message.title !== '' ? message.title : 'ahpio';
  event.waitUntil(self.registration.showNotification(title, {
    ...(typeof message.body === 'string' ? { body: message.body } : {}),
    icon: new URL('icon-192.png', base).href,
    // The page's own alert for a session has this tag, so either replaces the other.
    tag: uri === undefined ? `push:${host}` : `session-alert:${host}:${uri}`,
    data: { host, uri },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const { uri } = event.notification.data ?? {};
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const open = windows.find((one) => one.url.startsWith(base.href));
    if (open !== undefined) {
      await open.focus();
      if (uri !== undefined) open.postMessage({ open: { host, session: uri } });
      return;
    }
    const address = new URL(base);
    if (uri !== undefined) {
      address.searchParams.set('host', host);
      address.searchParams.set('session', uri);
    }
    await self.clients.openWindow(address.href);
  })());
});
