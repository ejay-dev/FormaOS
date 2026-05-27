import 'server-only';

import { withSpan } from '@/lib/observability/with-span';

// Audit 2026-05-27 — server-side PostHog capture.
//
// Why dependency-free: PostHog HTTPS capture endpoint accepts plain
// JSON POSTs. Avoiding posthog-node keeps the bundle small and lets us
// keep tight control of what crosses the wire (PII review matters
// here).
//
// Configuration:
//   POSTHOG_API_KEY    — project API key (NOT the personal API key
//                        used for the management API).
//   POSTHOG_HOST       — defaults to https://app.posthog.com; set to
//                        https://eu.posthog.com for EU project, or to
//                        a self-hosted host. Trailing slash optional.
//   POSTHOG_FAILSAFE   — set to '1' to suppress all errors silently.
//
// Drops events gracefully if the API key isn't configured — calls are
// no-ops in dev/test. Production fail-open: capture failures are logged
// but never throw.
//
// Event taxonomy (PII review):
//   - distinct_id: user_id (UUID) for user-scoped events, org_id (UUID)
//     for tenant-scoped events. NEVER an email or external identifier.
//   - properties: small structured set. NEVER raw user input, email
//     addresses, names, or anything that could re-identify outside our
//     data set.
//   - Sentinel events ship in three categories:
//       1. billing.*       — Stripe subscription lifecycle
//       2. user.purge.*    — GDPR purge job lifecycle
//       3. audit.anchor.*  — chain external-anchor lifecycle
//   Add new categories sparingly; PII review required for each.

type CaptureEvent = {
  distinctId: string;
  event: string;
  properties?: Record<string, string | number | boolean | null>;
  groups?: Record<string, string>;
  timestamp?: Date;
};

const CAPTURE_TIMEOUT_MS = 4_000;

function getApiKey(): string | null {
  return (process.env.POSTHOG_API_KEY ?? '').trim() || null;
}

function getHost(): string {
  return ((process.env.POSTHOG_HOST ?? '').trim() || 'https://app.posthog.com').replace(/\/+$/, '');
}

function isFailsafe(): boolean {
  return (process.env.POSTHOG_FAILSAFE ?? '').trim() === '1';
}

/**
 * Fire a single PostHog server-side event. Returns once the HTTP call
 * settles. Network failure is swallowed in production (failsafe) and
 * logged to stderr; the function never throws.
 */
export async function captureServerEvent(payload: CaptureEvent): Promise<void> {
  const apiKey = getApiKey();
  if (!apiKey) return;

  if (!payload.distinctId || typeof payload.distinctId !== 'string') {
    if (!isFailsafe()) {
      console.warn('[posthog-server] dropping event with no distinct_id:', payload.event);
    }
    return;
  }

  const body = {
    api_key: apiKey,
    event: payload.event,
    distinct_id: payload.distinctId,
    properties: {
      $lib: 'formaos-server',
      $lib_version: '1',
      ...stripPii(payload.properties ?? {}),
      ...(payload.groups ? { $groups: payload.groups } : {}),
    },
    timestamp: (payload.timestamp ?? new Date()).toISOString(),
  };

  await withSpan(
    `analytics.posthog.capture`,
    { 'analytics.event': payload.event },
    async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), CAPTURE_TIMEOUT_MS);
      try {
        const res = await fetch(`${getHost()}/i/v0/e/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        if (!res.ok) {
          if (!isFailsafe()) {
            const text = await res.text().catch(() => '');
            console.warn(
              `[posthog-server] capture ${payload.event} failed: HTTP ${res.status} ${text.slice(0, 200)}`,
            );
          }
        }
      } catch (err) {
        if (!isFailsafe()) {
          console.warn(
            `[posthog-server] capture ${payload.event} threw:`,
            err instanceof Error ? err.message : err,
          );
        }
      } finally {
        clearTimeout(timeout);
      }
    },
  );
}

/**
 * Sentinel set of common properties for billing events. Kept narrow
 * so PII review stays tractable.
 */
type StripeEventProps = {
  orgId: string;
  planKey?: string | null;
  status?: string | null;
  priceCents?: number | null;
  currency?: string | null;
  trialEnd?: string | null;
};

export async function captureStripeEvent(
  event:
    | 'billing.subscription.created'
    | 'billing.subscription.updated'
    | 'billing.subscription.canceled'
    | 'billing.subscription.paused'
    | 'billing.invoice.paid'
    | 'billing.invoice.voided',
  props: StripeEventProps,
): Promise<void> {
  await captureServerEvent({
    distinctId: props.orgId,
    event,
    properties: {
      plan_key: props.planKey ?? null,
      status: props.status ?? null,
      price_cents: props.priceCents ?? null,
      currency: props.currency ?? null,
      trial_end: props.trialEnd ?? null,
    },
    groups: { organization: props.orgId },
  });
}

export async function captureUserPurgeEvent(
  event:
    | 'user.purge.requested'
    | 'user.purge.started'
    | 'user.purge.completed'
    | 'user.purge.failed',
  userId: string,
  props: {
    requestSource?: string | null;
    refuseReason?: string | null;
    tableCount?: number | null;
  } = {},
): Promise<void> {
  await captureServerEvent({
    distinctId: userId,
    event,
    properties: {
      request_source: props.requestSource ?? null,
      refuse_reason: props.refuseReason ?? null,
      table_count: props.tableCount ?? null,
    },
  });
}

export async function captureAuditAnchorEvent(
  event: 'audit.anchor.recorded' | 'audit.anchor.failed',
  orgId: string,
  props: {
    provider: string;
    topSequenceNumber?: number;
    rekorEntryUuid?: string | null;
    reason?: string | null;
  },
): Promise<void> {
  await captureServerEvent({
    distinctId: orgId,
    event,
    properties: {
      provider: props.provider,
      top_sequence_number: props.topSequenceNumber ?? null,
      rekor_entry_uuid: props.rekorEntryUuid ?? null,
      reason: props.reason ?? null,
    },
    groups: { organization: orgId },
  });
}

// PII guard: strip well-known PII keys from properties. Belt-and-
// suspenders alongside the call-site discipline; if a caller
// accidentally passes `email`, `name`, `phone`, `address`, etc. we
// drop them rather than ship.
const PII_KEYS = new Set([
  'email',
  'email_address',
  'name',
  'full_name',
  'first_name',
  'last_name',
  'phone',
  'phone_number',
  'address',
  'street_address',
  'dob',
  'date_of_birth',
  'ssn',
  'tfn',
  'medicare',
  'ndis_participant_number',
]);

function stripPii(props: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props)) {
    if (PII_KEYS.has(k.toLowerCase())) {
      if (!isFailsafe()) {
        console.warn(`[posthog-server] dropping PII-named property: ${k}`);
      }
      continue;
    }
    out[k] = v;
  }
  return out;
}
