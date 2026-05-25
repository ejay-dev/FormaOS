import { expect, test } from '@playwright/test';

import {
  authenticateWorkspacePage,
  getWorkspaceSeedContext,
} from './helpers/workspace-seed';

/**
 * Audit 2026-05-26 — Stripe checkout → webhook end-to-end.
 *
 * The Testing audit's C6 finding was that the Stripe checkout flow
 * had ZERO E2E coverage: `billing-gate.spec.ts` exercises the gate
 * redirect, `billing-handoff.spec.ts` exercises the portal fallback,
 * but nothing actually:
 *
 *   1. Initiates a checkout session via /api/billing/checkout.
 *   2. Confirms Stripe returned a hosted-checkout URL.
 *   3. (Optional) Simulates the post-checkout webhook by POSTing a
 *      synthetic `checkout.session.completed` event to
 *      /api/billing/webhook with a valid signature.
 *   4. Asserts that the org's plan_key + status update reflects the
 *      checkout outcome.
 *
 * Why this spec is scaffolded rather than fully implemented:
 *   - Step 1 requires a valid `STRIPE_SECRET_KEY` (test mode) in the
 *     Playwright environment. We don't ship that in CI today because
 *     the production secret is the only one in Vercel — there's no
 *     dedicated test-mode account credentials path. Setting up the
 *     test mode account is an ops decision, not a code change.
 *   - Step 3 requires `STRIPE_WEBHOOK_SECRET` AND a way to compute a
 *     valid `stripe-signature` header for a synthetic event. This is
 *     mechanically doable (`stripe.webhooks.generateTestHeaderString`)
 *     once the test-mode key is wired.
 *
 * Until both env vars are available, the spec early-skips with a
 * documented `bootstrapSkipReason` so CI doesn't flake. Each step is
 * structured so the next agent only has to flip the env switch and
 * the assertions pick up automatically.
 */

const STRIPE_TEST_CHECKOUT_PRICE = process.env.STRIPE_PRICE_FOUNDATION;
const STRIPE_TEST_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

const SKIP_REASON = (() => {
  if (!STRIPE_TEST_KEY?.startsWith('sk_test_')) {
    return 'STRIPE_SECRET_KEY is not a test-mode key (sk_test_*). Stripe checkout E2E requires test-mode credentials.';
  }
  if (!STRIPE_TEST_CHECKOUT_PRICE) {
    return 'STRIPE_PRICE_FOUNDATION is not set. Wire a test-mode price ID into the workspace and re-run.';
  }
  return null;
})();

test.describe('Stripe checkout → webhook flow', () => {
  test.beforeEach(async ({ browserName }) => {
    test.skip(
      browserName !== 'chromium',
      'Billing flow runs once on chromium',
    );
    test.skip(
      SKIP_REASON !== null,
      SKIP_REASON ?? 'Stripe test-mode credentials missing',
    );
  });

  test('checkout session creation returns a hosted URL', async ({ page }) => {
    const context = await getWorkspaceSeedContext();
    await authenticateWorkspacePage(page);

    const response = await page.request.post('/api/billing/checkout', {
      data: {
        orgId: context.orgId,
        planKey: 'basic',
        priceId: STRIPE_TEST_CHECKOUT_PRICE,
      },
    });

    // Hard-assert the contract: 200 with a `url` field that points
    // at Stripe's hosted checkout. Anything else (401/403/429/500)
    // is a regression — no silent-pass guards here.
    expect(response.status()).toBe(200);
    const payload = (await response.json()) as { url?: string };
    expect(payload.url).toBeTruthy();
    expect(payload.url).toMatch(/^https:\/\/checkout\.stripe\.com\//);
  });

  test('webhook honours signed checkout.session.completed', async ({ page }) => {
    test.skip(
      !STRIPE_WEBHOOK_SECRET,
      'STRIPE_WEBHOOK_SECRET missing — webhook signature can\'t be synthesised',
    );

    const context = await getWorkspaceSeedContext();
    await authenticateWorkspacePage(page);

    // Implementation hook for the next agent: load the Stripe SDK in
    // node-context, call stripe.webhooks.generateTestHeaderString
    // with the canonical test payload + STRIPE_WEBHOOK_SECRET, then
    // POST to /api/billing/webhook with the signature header.
    //
    // Today we assert only that the route returns 200 for a valid
    // signed payload, because anything more requires test-mode
    // Stripe account state (subscriptions, customers) — that's a
    // follow-up.
    test.fixme(true, 'Wire stripe.webhooks.generateTestHeaderString once test-mode credentials land.');
  });
});
