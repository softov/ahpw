import { describe, expect, it } from 'vitest';
import { apply } from './index.js';

/** The route the plugin registers, from a host that only records it. */
function route(): (request: Request) => Promise<Response> {
  let registered: ((request: Request) => Promise<Response>) | undefined;
  void apply({ registerRoute: (handler: (request: Request) => Promise<Response>) => { registered = handler; } } as never, {});
  if (registered === undefined) throw new Error('no route registered');
  return registered;
}

describe('the plugin route', () => {
  it('says the daemon does not add the token, as ahpw serve answers the same file', async () => {
    const response = await route()(new Request('http://127.0.0.1:9187/plugins/ahpd-web/ahpw.json'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/json');
    expect(await response.json()).toEqual({ tokenHeld: false });
  });

  it('serves anything else from the page', async () => {
    const response = await route()(new Request('http://127.0.0.1:9187/plugins/ahpd-web/nothing-here.txt'));
    expect(response.status).toBe(404);
  });
});
