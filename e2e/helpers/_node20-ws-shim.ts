/**
 * Audit 2026-05-27: Playwright/TS variant of scripts/_node20-ws-shim.mjs.
 *
 * Side-effect import that polyfills globalThis.WebSocket from `ws` on
 * Node 20. Imported at the top of e2e helpers that create a Supabase
 * client so the eager RealtimeClient initialiser doesn't throw.
 *
 * No-op on Node 22+ (native WebSocket present).
 *
 * Implementation note: we avoid `createRequire` here because the
 * Playwright TS loader treats files with `import 'node:module'` as
 * pure ESM and rejects the resulting `exports`-using transpiled output.
 * Using `require` directly works under Playwright's CJS-default
 * compilation for .ts files.
 */

declare const require: NodeJS.Require | undefined;

if (typeof globalThis.WebSocket === 'undefined') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ws = typeof require === 'function' ? require('ws') : null;
    if (ws) {
      (globalThis as { WebSocket?: unknown }).WebSocket = ws.WebSocket ?? ws;
    }
  } catch {
    // ws unresolvable — leave undefined so supabase-js produces a clear error.
  }
}

export {};
