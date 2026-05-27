// Audit 2026-05-27: shared WebSocket polyfill for Node 20 scripts that
// construct a Supabase JS client. supabase-js eagerly instantiates a
// RealtimeClient inside createClient(), and RealtimeClient requires
// `globalThis.WebSocket` — present in Node 22+, absent in Node 20.
// Without this shim, scripts crash before reading anything from the
// database with "Node.js 20 detected without native WebSocket support".
//
// `ws` is already in the dependency tree as a transitive of
// @supabase/realtime-js, so importing it adds no install footprint.
//
// Side-effect import: just `import './_node20-ws-shim.mjs'` at the top
// of any script that uses createClient and the global is patched.

import { createRequire } from 'node:module';

const localRequire = createRequire(import.meta.url);

if (typeof globalThis.WebSocket === 'undefined') {
  try {
    globalThis.WebSocket = localRequire('ws');
  } catch {
    // `ws` unresolvable — leave the global unset; supabase-js will
    // produce a clearer error than anything we could synthesize here.
  }
}
