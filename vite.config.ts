import { resolve } from 'node:path';
import type { Alias } from 'vite';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

/** The daemon `pnpm dev` talks to. Its config needs `"http": true`. */
const daemon = process.env['AHPD_URL'] ?? 'http://127.0.0.1:9187';

/**
 * `AHPW_SCENA=<a scena checkout>` runs ahpw on that checkout's scena source
 * instead of the installed package, to try a scena change before it is
 * released. The entries are the ones scena's playground maps; the checkout
 * needs its own `pnpm install`.
 */
function scenaSource(checkout: string): Alias[] {
  const src = resolve(checkout, 'packages/scena/src');
  const entry = (name: string, file: string): Alias => ({ find: new RegExp(`^@softov/scena${name}$`), replacement: resolve(src, file) });
  return [
    entry('/react/core', 'react/core.ts'),
    entry('/react', 'react/index.ts'),
    entry('/sdk', 'sdk/index.ts'),
    entry('/types', 'sdk/index.ts'),
    entry('/core', 'core/index.ts'),
    entry('/runtime', 'runtime/index.ts'),
    entry('/ui/builtins', 'ui/register.ts'),
    { find: /^@softov\/scena\/ui\/([a-z]+)$/, replacement: `${resolve(src, 'ui')}/$1/index.ts` },
    entry('/ui', 'ui/index.ts'),
    { find: /^@softov\/scena\/styles\/(.+)$/, replacement: `${resolve(src, 'styles')}/$1` },
    entry('/styles', 'styles/index.ts'),
    entry('/themes', 'themes/index.ts'),
    entry('/porta/examples', 'porta/providers/examples/index.ts'),
    entry('/porta', 'porta/index.ts'),
    entry('', 'index.ts'),
  ];
}
const scena = process.env['AHPW_SCENA'];

export default defineConfig({
  plugins: [react()],
  resolve: {
    // One React, whether scena is installed or comes from a checkout with its own.
    dedupe: ['react', 'react-dom'],
    alias: scena === undefined || scena === '' ? [] : scenaSource(scena),
  },
  // Relative, because the daemon serves the page under /plugins/ahpd-web/.
  base: './',
  build: {
    outDir: 'dist/app',
    emptyOutDir: true,
    rolldownOptions: {
      // scena's catalogs lazy-load components this app also imports, so those stay in the main chunk.
      onLog(level, log, handler) {
        if (log.code === 'INEFFECTIVE_DYNAMIC_IMPORT' && log.message.includes('/scena/')) return;
        handler(level, log);
      },
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5180,
    proxy: {
      '/api': {
        target: daemon,
        changeOrigin: true,
        // The daemon refuses an Origin it does not serve, and this dev server
        // is not one. Production is same-origin and sends its own.
        configure: (proxy) => {
          proxy.on('proxyReq', (request) => request.removeHeader('origin'));
        },
      },
      // The daemon's AHP socket answers at its root, which this dev server
      // keeps for the page, so the page connects here instead.
      '/ahp': {
        target: daemon,
        ws: true,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ahp\/?/, '/'),
      },
    },
  },
  test: {
    include: ['src/**/*.test.ts', 'plugin/**/*.test.ts', 'cli/**/*.test.ts'],
    // English is registered, so code that translates reads as it does in an English page.
    setupFiles: ['src/i18n/test-setup.ts'],
    // Linked or installed, scena's components import their own CSS.
    server: { deps: { inline: ['@softov/scena'] } },
  },
});
