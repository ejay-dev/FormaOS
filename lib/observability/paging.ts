import 'server-only';

import { billingLogger } from '@/lib/observability/structured-logger';

/**
 * Audit 2026-05-26 (H1): on-call paging via PagerDuty Events API v2.
 *
 * Background: ONCALL.md flagged that the only P0 signal we had was the
 * Sentry mobile app push notification — not loud enough to wake a
 * founder at 3 AM. This module adds an HTTP-only PagerDuty trigger so
 * select code paths can escalate beyond Sentry email.
 *
 * Operational notes:
 *   - Activates only when `PAGERDUTY_ROUTING_KEY` is set in the
 *     environment. Without it, every call is a no-op with a single
 *     structured warning log — code paths can call `pageOnCall`
 *     unconditionally and we don't need feature flags.
 *   - Uses PagerDuty Events API v2 (https://events.pagerduty.com).
 *     No SDK needed; one POST per page.
 *   - The fetch has a hard 3-second timeout; if PagerDuty itself is
 *     down we don't want the caller's request to hang.
 *
 * Setup (operator action):
 *   1. PagerDuty → Service → Integrations → "Events API v2".
 *   2. Copy the integration key (a 32-char hex string).
 *   3. Set `PAGERDUTY_ROUTING_KEY=<key>` in Vercel production env vars.
 *   4. Trigger a known P0 path (e.g. failed Stripe webhook on staging)
 *      and confirm an incident appears in PagerDuty within ~10s.
 *
 * Alert wiring: see sentry/alerts.yaml — alerts tagged `severity: P0`
 * should mirror the call to this helper at the same code site.
 */

type PageSeverity = 'critical' | 'error' | 'warning' | 'info';

export interface PageInput {
  severity: PageSeverity;
  /** One-line human summary, shown as the PagerDuty incident title. */
  summary: string;
  /** Short identifier of the system raising the page, e.g. 'billing.webhook'. */
  component: string;
  /**
   * Stable de-duplication key. Two pages with the same dedup_key
   * within ~24h are coalesced into one PagerDuty incident.
   */
  dedupKey?: string;
  /** Arbitrary JSON-safe context displayed in the PagerDuty alert body. */
  context?: Record<string, unknown>;
}

const PAGERDUTY_ENDPOINT = 'https://events.pagerduty.com/v2/enqueue';
const FETCH_TIMEOUT_MS = 3000;

/**
 * Trigger a PagerDuty incident. Returns:
 *   - `{ ok: true }` when PagerDuty accepted (HTTP 202)
 *   - `{ ok: false, skipped: true }` when no `PAGERDUTY_ROUTING_KEY`
 *     is configured (the common dev/preview case)
 *   - `{ ok: false, error }` for any other failure path
 *
 * Never throws — paging is best-effort and a paging failure must not
 * mask the underlying incident.
 */
export async function pageOnCall(
  input: PageInput,
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const routingKey = process.env.PAGERDUTY_ROUTING_KEY?.trim();
  if (!routingKey) {
    // Single warning per invocation; never let the absence of paging
    // be silent for the path that raised it.
    billingLogger.warn('pageOnCall_skipped_no_routing_key', {
      component: input.component,
      summary: input.summary,
      severity: input.severity,
    });
    return { ok: false, skipped: true };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(PAGERDUTY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        routing_key: routingKey,
        event_action: 'trigger',
        dedup_key: input.dedupKey,
        payload: {
          summary: input.summary,
          severity: input.severity,
          source: 'formaos',
          component: input.component,
          custom_details: input.context ?? {},
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      billingLogger.error(
        'pageOnCall_failed',
        new Error(`pagerduty_status_${response.status}`),
        {
          component: input.component,
          summary: input.summary,
          status: response.status,
          body: text.slice(0, 500),
        },
      );
      return { ok: false, error: `pagerduty_status_${response.status}` };
    }

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown';
    billingLogger.error(
      'pageOnCall_threw',
      err instanceof Error ? err : new Error(message),
      {
        component: input.component,
        summary: input.summary,
      },
    );
    return { ok: false, error: message };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Resolve a previously-triggered PagerDuty incident by its dedup key.
 * Useful when a transient error path self-recovers (e.g. Stripe
 * recovered, cron caught up).
 */
export async function resolvePage(
  dedupKey: string,
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const routingKey = process.env.PAGERDUTY_ROUTING_KEY?.trim();
  if (!routingKey) {
    return { ok: false, skipped: true };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(PAGERDUTY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        routing_key: routingKey,
        event_action: 'resolve',
        dedup_key: dedupKey,
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      return { ok: false, error: `pagerduty_status_${response.status}` };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'unknown',
    };
  } finally {
    clearTimeout(timer);
  }
}
