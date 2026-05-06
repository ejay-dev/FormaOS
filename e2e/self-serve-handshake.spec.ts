import { expect, test } from '@playwright/test';

/**
 * Self-serve checkout handshake — failure-mode contracts
 *
 * Validates the edges of the Foundation self-serve flow:
 *   pricing CTA → /auth/signup?plan=basic&intent=checkout&source=pricing
 *     → sets formaos_checkout_intent cookie
 *     → verify email + org bootstrap
 *     → /app reads cookie → /app/billing?autoCheckout=basic → Stripe Checkout
 *
 * Auth-bound flows (email verification, org bootstrap, actual Stripe redirect)
 * need a seeded user and are covered by trial-provisioning-guarantee.spec.ts
 * plus manual smoke tests. This suite locks down the public-facing contracts
 * and middleware guarantees so failure modes don't regress silently.
 */

test.describe('Self-serve checkout handshake', () => {
  test('signup with checkout intent sets formaos_checkout_intent cookie', async ({
    page,
    context,
  }) => {
    const response = await page.goto(
      '/auth/signup?plan=basic&intent=checkout&source=pricing',
      { waitUntil: 'domcontentloaded' },
    );
    expect(response?.status()).toBeLessThan(400);

    // Cookie is set in a useEffect, so wait a tick for hydration.
    await page.waitForFunction(() =>
      document.cookie.includes('formaos_checkout_intent'),
    );

    const cookies = await context.cookies();
    const intentCookie = cookies.find(
      (c) => c.name === 'formaos_checkout_intent',
    );
    expect(intentCookie).toBeDefined();
    expect(intentCookie?.value).toBe('basic');
  });

  test('signup without intent does not set the checkout cookie', async ({
    page,
    context,
  }) => {
    const response = await page.goto('/auth/signup', {
      waitUntil: 'domcontentloaded',
    });
    expect(response?.status()).toBeLessThan(400);

    // Give hydration a beat; the cookie should never be written here.
    await page.waitForLoadState('networkidle');
    const cookies = await context.cookies();
    const intentCookie = cookies.find(
      (c) => c.name === 'formaos_checkout_intent',
    );
    expect(intentCookie).toBeUndefined();
  });

  test('signup with unknown plan does not set checkout cookie and still renders', async ({
    page,
    context,
  }) => {
    const response = await page.goto(
      '/auth/signup?plan=not-a-real-plan&intent=checkout',
      { waitUntil: 'domcontentloaded' },
    );
    expect(response?.status()).toBeLessThan(400);

    await page.waitForLoadState('networkidle');
    const cookies = await context.cookies();
    const intentCookie = cookies.find(
      (c) => c.name === 'formaos_checkout_intent',
    );
    expect(intentCookie).toBeUndefined();
  });

  test('signup with non-self-serve plan (enterprise) does not set the cookie', async ({
    page,
    context,
  }) => {
    // Enterprise is the only plan that is NOT self-serve — the cookie path must
    // not trigger even if a bad link tries ?plan=enterprise&intent=checkout.
    const response = await page.goto(
      '/auth/signup?plan=enterprise&intent=checkout',
      {
        waitUntil: 'domcontentloaded',
      },
    );
    expect(response?.status()).toBeLessThan(400);

    await page.waitForLoadState('networkidle');
    const cookies = await context.cookies();
    const intentCookie = cookies.find(
      (c) => c.name === 'formaos_checkout_intent',
    );
    expect(intentCookie).toBeUndefined();
  });

  test('signup with pro plan (Growth) sets formaos_checkout_intent cookie', async ({
    page,
    context,
  }) => {
    const response = await page.goto(
      '/auth/signup?plan=pro&intent=checkout&source=pricing',
      { waitUntil: 'domcontentloaded' },
    );
    expect(response?.status()).toBeLessThan(400);

    await page.waitForFunction(() =>
      document.cookie.includes('formaos_checkout_intent'),
    );

    const cookies = await context.cookies();
    const intentCookie = cookies.find(
      (c) => c.name === 'formaos_checkout_intent',
    );
    expect(intentCookie).toBeDefined();
    expect(intentCookie?.value).toBe('pro');
  });

  test('signup with scale plan sets formaos_checkout_intent cookie', async ({
    page,
    context,
  }) => {
    const response = await page.goto(
      '/auth/signup?plan=scale&intent=checkout&source=pricing',
      { waitUntil: 'domcontentloaded' },
    );
    expect(response?.status()).toBeLessThan(400);

    await page.waitForFunction(() =>
      document.cookie.includes('formaos_checkout_intent'),
    );

    const cookies = await context.cookies();
    const intentCookie = cookies.find(
      (c) => c.name === 'formaos_checkout_intent',
    );
    expect(intentCookie).toBeDefined();
    expect(intentCookie?.value).toBe('scale');
  });

  test('anonymous hit on /app redirects to auth without leaking intent cookie', async ({
    page,
    context,
  }) => {
    // Plant a stale intent cookie as if a previous session left one behind.
    await context.addCookies([
      {
        name: 'formaos_checkout_intent',
        value: 'basic',
        domain: 'localhost',
        path: '/',
        expires: Math.floor(Date.now() / 1000) + 600,
      },
    ]);

    const response = await page.goto('/app', { waitUntil: 'domcontentloaded' });
    // Middleware should bounce an unauthenticated user to auth. We do not
    // assert the exact redirect target (can vary by env) — only that we did
    // not land on the dashboard with the cookie interpreted against no user.
    expect(response?.url()).not.toMatch(/\/app\/?(\?|#|$)/);
  });

  test('pricing Foundation CTA matches the signup handshake URL shape', async ({
    page,
  }) => {
    await page.goto('/pricing', { waitUntil: 'domcontentloaded' });
    const href = await page
      .getByTestId('pricing-foundation-cta')
      .getAttribute('href');
    expect(href).not.toBeNull();
    expect(href).toContain('/auth/signup');
    expect(href).toContain('plan=basic');
    expect(href).toContain('intent=checkout');
    expect(href).toContain('source=pricing');
  });
});
