import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

/** The daemon `pnpm dev` talks to. Its config needs `"http": true`. */
const daemon = process.env['AHPD_URL'] ?? 'http://127.0.0.1:9187';

export default defineConfig({
  plugins: [react()],
  // One React, whether scena is installed or linked from a checkout with its own.
  resolve: { dedupe: ['react', 'react-dom'] },
  // Relative, because the daemon serves the page under /plugins/ahpd-web/.
  base: './',
  build: { outDir: 'dist/app', emptyOutDir: true },
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
    include: ['src/**/*.test.ts', 'plugin/**/*.test.ts'],
    // Linked or installed, scena's components import their own CSS.
    server: { deps: { inline: ['@softov/scena'] } },
  },
});
