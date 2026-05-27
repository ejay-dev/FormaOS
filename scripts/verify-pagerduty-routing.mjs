#!/usr/bin/env node

// Audit 2026-05-27 — verify PagerDuty Events API integration.
// Sends an `info`-severity synthetic event (NOT a real alert) so the
// operator can confirm the routing key is valid + the integration
// fires + the event lands in the right service. Auto-resolves the
// event 60 seconds later so the on-call queue stays clean.
//
// Usage:
//   PAGERDUTY_ROUTING_KEY=<key> node scripts/verify-pagerduty-routing.mjs
//
// Exit 0 on successful trigger+resolve. Non-zero on any HTTP failure.

import { argv, exit } from 'node:process';

const routingKey = (process.env.PAGERDUTY_ROUTING_KEY ?? '').trim();
if (!routingKey) {
  console.error('PAGERDUTY_ROUTING_KEY env var is required.');
  exit(2);
}

const dryRun = argv.includes('--dry-run');
const dedupKey = `formaos-pd-verify-${Date.now()}`;

async function postEvent(body) {
  const res = await fetch('https://events.pagerduty.com/v2/enqueue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${text.slice(0, 200)}`);
  }
  return res.json();
}

if (dryRun) {
  console.log('--dry-run: skipping actual PagerDuty trigger.');
  console.log('Would post:');
  console.log({
    routing_key: routingKey.slice(0, 6) + '…',
    event_action: 'trigger',
    dedup_key: dedupKey,
    payload: { summary: 'FormaOS PD-routing verification (synthetic)', severity: 'info', source: 'verify-pagerduty-routing.mjs' },
  });
  exit(0);
}

const triggerBody = {
  routing_key: routingKey,
  event_action: 'trigger',
  dedup_key: dedupKey,
  payload: {
    summary: 'FormaOS PagerDuty routing verification (synthetic — auto-resolves in 60s)',
    severity: 'info',
    source: 'verify-pagerduty-routing.mjs',
    component: 'audit-2026-05-27',
    custom_details: {
      purpose: 'Confirm PAGERDUTY_ROUTING_KEY is valid + the routing integration fires.',
      auto_resolve_in_seconds: 60,
    },
  },
};

console.log(`Triggering synthetic event with dedup_key=${dedupKey}…`);
const triggerResp = await postEvent(triggerBody).catch((err) => {
  console.error(`Trigger failed: ${err.message}`);
  exit(1);
});
console.log(`✓ Trigger response: ${JSON.stringify(triggerResp)}`);

console.log(`Sleeping 60s then auto-resolving so the on-call queue stays clean…`);
await new Promise((resolve) => setTimeout(resolve, 60_000));

const resolveBody = {
  routing_key: routingKey,
  event_action: 'resolve',
  dedup_key: dedupKey,
};

const resolveResp = await postEvent(resolveBody).catch((err) => {
  console.error(`Resolve failed: ${err.message}`);
  console.error(`*** Manual cleanup required: resolve dedup_key=${dedupKey} via PagerDuty UI.`);
  exit(1);
});
console.log(`✓ Resolve response: ${JSON.stringify(resolveResp)}`);
console.log('');
console.log('✓ PagerDuty routing verified — synthetic event fired + resolved.');
console.log('  Check the on-call channel for the brief notification (≈60s window).');
exit(0);
