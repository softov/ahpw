import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { staticRoute } from './static.js';

const PREFIX = '/plugins/ahpd-web/';
let route: (request: Request) => Promise<Response>;
let outside: string;

beforeAll(() => {
  const dir = mkdtempSync(join(tmpdir(), 'ahpd-web-'));
  const root = join(dir, 'app');
  mkdirSync(join(root, 'assets'), { recursive: true });
  writeFileSync(join(root, 'index.html'), '<!doctype html>');
  writeFileSync(join(root, 'assets', 'a-1.js'), 'export {}');
  outside = join(dir, 'secret.txt');
  writeFileSync(outside, 'secret');
  route = staticRoute(root, PREFIX);
});

const get = (path: string, method = 'GET'): Promise<Response> =>
  route(new Request(`http://127.0.0.1:9187${path}`, { method }));

describe('staticRoute', () => {
  it('serves the page at the prefix', async () => {
    const response = await get(PREFIX);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    expect(response.headers.get('cache-control')).toBe('no-cache');
    expect(response.headers.get('content-security-policy')).toContain("default-src 'self'");
    expect(await response.text()).toBe('<!doctype html>');
  });

  it('redirects the bare prefix to the one with a slash', async () => {
    const response = await get('/plugins/ahpd-web');
    expect(response.status).toBe(308);
    expect(response.headers.get('location')).toBe(PREFIX);
  });

  it('serves hashed assets as immutable', async () => {
    const response = await get(`${PREFIX}assets/a-1.js`);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/javascript');
    expect(response.headers.get('cache-control')).toContain('immutable');
  });

  it('answers HEAD without a body and refuses writes', async () => {
    const head = await get(PREFIX, 'HEAD');
    expect(head.status).toBe(200);
    expect(await head.text()).toBe('');
    expect((await get(PREFIX, 'POST')).status).toBe(405);
  });

  it('never leaves the root', async () => {
    for (const path of [
      `${PREFIX}../secret.txt`,
      `${PREFIX}%2e%2e/secret.txt`,
      `${PREFIX}assets/%2e%2e%2f%2e%2e%2fsecret.txt`,
      `${PREFIX}..%2fsecret.txt`,
      `${PREFIX}..%5csecret.txt`,
      `${PREFIX}${encodeURIComponent(outside)}`,
    ]) {
      const response = await get(path);
      expect(response.status, path).not.toBe(200);
      expect(await response.text(), path).not.toContain('secret');
    }
  });

  it('answers 404 for a missing file', async () => {
    expect((await get(`${PREFIX}nope.js`)).status).toBe(404);
  });
});
