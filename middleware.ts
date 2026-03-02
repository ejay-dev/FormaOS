/**
 * Next.js Middleware
 *
 * Re-exports the proxy function and matcher config so Next.js
 * picks them up automatically.  All logic lives in proxy.ts.
 */

export { proxy as middleware, config } from './proxy';
