// Audit 2026-05-27: CommonJS variant of _node20-ws-shim.mjs.
//
// Required at the top of CJS scripts that construct a Supabase JS
// client. supabase-js eagerly instantiates a RealtimeClient inside
// createClient(), and RealtimeClient requires `globalThis.WebSocket`
// — present in Node 22+, absent in Node 20.
//
// `ws` is already in the dependency tree as a transitive of
// @supabase/realtime-js (also jest-environment-jsdom, openai,
// puppeteer), so requiring it adds no install footprint.
//
// Side-effect require: `require('./_node20-ws-shim.cjs')` at the top
// of any CJS script that uses createClient and the global is patched.

if (typeof globalThis.WebSocket === 'undefined') {
  try {
    const ws = require('ws');
    globalThis.WebSocket = ws.WebSocket || ws;
  } catch (_err) {
    // ws not installed in this environment — leave undefined so the
    // Supabase realtime client throws its own helpful error.
  }
}

module.exports = {};
