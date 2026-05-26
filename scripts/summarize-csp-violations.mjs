#!/usr/bin/env node
/**
 * Summarize CSP violation reports captured to Sentry as
 * `csp_violation` events.
 *
 * Audit 2026-05-26 (H2 step 2 prep): triage helper for the Report-Only
 * CSP that proxy.ts ships. Pulls recent events from the Sentry REST
 * API, groups by (violated-directive, blocked-uri), and prints a
 * leaderboard. The output drives the decision to flip the enforcing
 * `style-src` from `'unsafe-inline'` to nonce-based — once the top
 * sources are either fixed in code or allowlisted via hash, run the
 * script again and confirm the count trends to zero.
 *
 * Setup:
 *   1. Create a Sentry API token (Settings → Auth Tokens → New
 *      Internal Integration; scope: `event:read`).
 *   2. Export:
 *        export SENTRY_API_TOKEN=...
 *        export SENTRY_ORG_SLUG=...          # e.g. formaos
 *        export SENTRY_PROJECT_SLUG=...      # e.g. formaos
 *   3. Run:
 *        node scripts/summarize-csp-violations.mjs
 *      Optional flags:
 *        --hours 168           # default 24
 *        --top 30              # default 20
 *        --json                # raw JSON output for piping
 *
 * Exits non-zero only on hard failure (missing token, network error).
 * Empty result set returns 0.
 */

import process from 'node:process';

function parseFlag(name, fallback) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] ?? fallback;
}

function requireEnv(name) {
  const v = process.env[name]?.trim();
  if (!v) {
    console.error(`✗ Missing ${name}. See header of this file for setup.`);
    process.exit(1);
  }
  return v;
}

async function fetchEvents({ token, org, project, hours }) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  // Sentry's `events` endpoint paginates with `cursor`. We iterate
  // until either 1000 events or no `next` link.
  let url =
    `https://sentry.io/api/0/projects/${encodeURIComponent(org)}/` +
    `${encodeURIComponent(project)}/events/?query=` +
    encodeURIComponent('message:"csp_violation"') +
    `&statsPeriod=${hours}h`;
  const collected = [];

  for (let page = 0; page < 10; page++) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      console.error(`✗ Sentry API ${res.status}:`, await res.text());
      process.exit(1);
    }
    const items = await res.json();
    for (const ev of items) {
      const eventTs = Date.parse(ev.dateCreated ?? '');
      if (Number.isFinite(eventTs) && new Date(eventTs).toISOString() < since)
        continue;
      collected.push(ev);
    }
    const link = res.headers.get('link') ?? '';
    const next = link
      .split(',')
      .map((p) => p.trim())
      .find((p) => p.includes('rel="next"') && p.includes('results="true"'));
    if (!next) break;
    const m = next.match(/<([^>]+)>/);
    if (!m) break;
    url = m[1];
    if (collected.length >= 1000) break;
  }

  return collected;
}

function summarize(events) {
  const buckets = new Map();
  for (const ev of events) {
    // `tags` is `[ { key, value }, ... ]` on the events API. The
    // captureMessage call in /api/csp-report sets `directive` and
    // `report_type` as tags, and the full violation in `extra`.
    const tags = Object.fromEntries(
      (ev.tags ?? []).map((t) => [t.key, t.value]),
    );
    const directive = tags.directive ?? 'unknown';
    const blockedUri =
      ev.context?.cspViolation?.extra?.blockedUri ??
      tags.blocked_uri ??
      'unknown';
    const key = `${directive} :: ${blockedUri}`;
    const entry = buckets.get(key) ?? { count: 0, directive, blockedUri };
    entry.count += 1;
    buckets.set(key, entry);
  }
  return Array.from(buckets.values()).sort((a, b) => b.count - a.count);
}

async function main() {
  const token = requireEnv('SENTRY_API_TOKEN');
  const org = requireEnv('SENTRY_ORG_SLUG');
  const project = requireEnv('SENTRY_PROJECT_SLUG');
  const hours = Number.parseInt(parseFlag('hours', '24'), 10);
  const top = Number.parseInt(parseFlag('top', '20'), 10);
  const asJson = process.argv.includes('--json');

  console.error(
    `Fetching csp_violation events for ${org}/${project} over the last ${hours}h…`,
  );
  const events = await fetchEvents({ token, org, project, hours });
  const summary = summarize(events);

  if (asJson) {
    process.stdout.write(
      JSON.stringify(
        { totalEvents: events.length, distinctBuckets: summary.length, summary },
        null,
        2,
      ),
    );
    process.stdout.write('\n');
    return;
  }

  console.log('');
  console.log(`Total events:        ${events.length}`);
  console.log(`Distinct (dir, uri): ${summary.length}`);
  console.log('');

  if (summary.length === 0) {
    console.log('No CSP violations in the window. ✓');
    console.log(
      'If the window is ≥ 1 week and prior runs also showed 0, the H2',
    );
    console.log("rollout is ready to flip 'unsafe-inline' off in proxy.ts.");
    return;
  }

  const rows = summary.slice(0, top);
  const widthCount = Math.max(5, String(rows[0].count).length);
  const widthDir = Math.max(
    9,
    ...rows.map((r) => r.directive.length),
  );
  console.log(
    `${'COUNT'.padStart(widthCount)}  ${'DIRECTIVE'.padEnd(widthDir)}  BLOCKED-URI`,
  );
  console.log(
    `${'-'.repeat(widthCount)}  ${'-'.repeat(widthDir)}  ${'-'.repeat(40)}`,
  );
  for (const r of rows) {
    console.log(
      `${String(r.count).padStart(widthCount)}  ` +
        `${r.directive.padEnd(widthDir)}  ${r.blockedUri}`,
    );
  }
  if (summary.length > top) {
    console.log(`… and ${summary.length - top} more buckets.`);
  }
}

main().catch((err) => {
  console.error('✗', err instanceof Error ? err.message : err);
  process.exit(1);
});
