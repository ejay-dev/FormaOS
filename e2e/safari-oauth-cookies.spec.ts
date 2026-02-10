import { test, expect, type BrowserContext } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const APP_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

// ⚠️ CRITICAL: E2E tests MUST use environment variables for Supabase credentials
// Never hardcode Supabase URLs or keys - they will be rotated and tests will fail
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

// Support both SUPABASE_SERVICE_ROLE_KEY and SUPABASE_SERVICE_ROLE (for backward compatibility)
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

// Fail fast if required environment variables are not set
if (!SUPABASE_URL) {
  throw new Error(
    'NEXT_PUBLIC_SUPABASE_URL environment variable is required for E2E tests. ' +
      'Set it in your .env.test file or via environment.',
  );
}

if (!SERVICE_ROLE_KEY) {
  throw new Error(
    'SUPABASE_SERVICE_ROLE_KEY environment variable is required for E2E tests. ' +
      'Set it in your .env.test file or via environment.',
  );
}

const timestamp = Date.now();

let admin: any; // Supabase admin client - using any to avoid type generation requirement
const createdUserIds: string[] = [];
const createdOrgIds = new Set<string>();

test.describe('Mobile Safari OAuth Cookie Persistence', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(() => {
    admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  });

  test.afterAll(async () => {
    // Cleanup
    for (const orgId of Array.from(createdOrgIds)) {
      await admin.from('org_tasks').delete().eq('organization_id', orgId);
      await admin.from('org_evidence').delete().eq('organization_id', orgId);
      await admin
        .from('org_entitlements')
        .delete()
        .eq('organization_id', orgId);
      await admin
        .from('org_subscriptions')
        .delete()
        .eq('organization_id', orgId);
      await admin
        .from('org_onboarding_status')
        .delete()
        .eq('organization_id', orgId);
      await admin.from('org_members').delete().eq('organization_id', orgId);
      await admin.from('orgs').delete().eq('id', orgId);
      await admin.from('organizations').delete().eq('id', orgId);
    }

    for (const userId of createdUserIds) {
      await admin.auth.admin.deleteUser(userId);
    }
  });

  test('OAuth flow with Safari-like cookie restrictions', async ({
    browser,
  }) => {
    // Create a Safari-like context with strict cookie settings
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      viewport: { width: 390, height: 844 }, // iPhone 14 Pro
      hasTouch: true,
      isMobile: true,
    });

    const page = await context.newPage();

    const email = `qa.safari.oauth.${timestamp}@formaos.team`;

    // Create user via admin
    const { data, error } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
    });

    expect(error).toBeNull();
    expect(data?.user?.id).toBeTruthy();
    const userId = data!.user!.id;
    createdUserIds.push(userId);

    // Set up OAuth provider metadata
    try {
      await admin.auth.admin.updateUserById(userId, {
        app_metadata: { provider: 'google', providers: ['google'] },
      });
    } catch {
      // Non-fatal
    }

    // Generate magic link to simulate OAuth callback
    const { data: linkData, error: linkError } = await (
      admin as any
    ).auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: `${APP_URL}/auth/callback`,
      },
    });

    expect(linkError).toBeNull();
    expect(linkData?.properties?.action_link).toBeTruthy();

    // Navigate directly to the OAuth callback link
    await page.goto(linkData.properties.action_link);

    // Wait for redirect (should NOT be back to /auth/signin or /auth/signup)
    await page.waitForURL(/\/(app|onboarding)/, { timeout: 20000 });

    const currentUrl = page.url();
    console.log('[Safari Test] After OAuth, landed on:', currentUrl);

    // Verify we're NOT on auth pages
    expect(currentUrl).not.toMatch(/\/auth\/signin/);
    expect(currentUrl).not.toMatch(/\/auth\/signup/);
    expect(currentUrl).not.toMatch(/\/auth\/login/);

    // Verify we're on app or onboarding
    expect(currentUrl).toMatch(/\/(app|onboarding)/);

    // Check that cookies are set properly
    const cookies = await context.cookies();
    const authCookies = cookies.filter(
      (cookie) =>
        cookie.name.includes('sb-') ||
        cookie.name.includes('supabase') ||
        cookie.name.includes('auth'),
    );

    console.log('[Safari Test] Auth cookies found:', authCookies.length);
    expect(authCookies.length).toBeGreaterThan(0);

    // Verify cookies have correct attributes for mobile Safari
    authCookies.forEach((cookie) => {
      // Should be Lax or None (not Strict which Safari often blocks)
      if (cookie.sameSite) {
        expect(['Lax', 'None', 'lax', 'none']).toContain(cookie.sameSite);
      }

      // If sameSite=None, must be Secure
      const sameSite = cookie.sameSite as string;
      if (sameSite === 'None' || sameSite === 'none') {
        expect(cookie.secure).toBe(true);
      }

      // Should have proper path
      expect(cookie.path).toBe('/');
    });

    // Test session persistence: refresh page
    await page.reload({ waitUntil: 'networkidle' });

    // Should still be on app/onboarding (not redirected to auth)
    const urlAfterRefresh = page.url();
    console.log('[Safari Test] After refresh, still on:', urlAfterRefresh);

    expect(urlAfterRefresh).not.toMatch(/\/auth\/signin/);
    expect(urlAfterRefresh).not.toMatch(/\/auth\/signup/);
    expect(urlAfterRefresh).toMatch(/\/(app|onboarding)/);

    // Check system state API works (proves session is valid)
    const response = await page.request.get('/api/system-state');
    expect(response.ok()).toBe(true);

    const systemState = await response.json();
    expect(systemState.authenticated).toBe(true);
    expect(systemState.user?.id).toBe(userId);

    // Verify organization was created
    const { data: membership } = await admin
      .from('org_members')
      .select('organization_id')
      .eq('user_id', userId)
      .maybeSingle();

    expect(membership?.organization_id).toBeTruthy();
    if (membership?.organization_id) {
      createdOrgIds.add(membership.organization_id);
    }

    await context.close();
  });

  test('No double-login loop for returning user', async ({ browser }) => {
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    });

    const page = await context.newPage();

    const email = `qa.safari.returning.${timestamp}@formaos.team`;
    const now = new Date().toISOString();

    // Create user with completed onboarding
    const { data, error } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
    });

    expect(error).toBeNull();
    const userId = data!.user!.id;
    createdUserIds.push(userId);

    // Create organization with completed onboarding
    const { data: org, error: orgError } = await admin
      .from('organizations')
      .insert({
        name: 'QA Safari Returning User Org',
        created_by: userId,
        plan_key: 'basic',
        plan_selected_at: now,
        onboarding_completed: true, // Already completed
        industry: 'technology',
        team_size: '1-10',
        frameworks: ['iso27001'],
      })
      .select('id')
      .single();

    expect(orgError).toBeNull();
    expect(org?.id).toBeTruthy();
    const orgId = org!.id;
    createdOrgIds.add(orgId);

    // Add user as member
    await admin.from('org_members').insert({
      organization_id: orgId,
      user_id: userId,
      role: 'owner',
      status: 'active',
      email: email,
    });

    // Create subscription
    await admin.from('org_subscriptions').insert({
      org_id: orgId,
      organization_id: orgId,
      plan_code: 'starter',
      plan_key: 'basic',
      status: 'active',
      updated_at: now,
    });

    // Generate magic link
    const { data: linkData } = await (admin as any).auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: `${APP_URL}/auth/callback`,
      },
    });

    // Navigate to OAuth callback
    await page.goto(linkData.properties.action_link);

    // Should land in /app or /app/dashboard, NOT /app/onboarding
    await page.waitForURL(/\/app/, { timeout: 20000 });

    const currentUrl = page.url();
    console.log('[Safari Test] Returning user landed on:', currentUrl);

    // Should NOT be on onboarding (already completed)
    expect(currentUrl).not.toMatch(/\/onboarding/);

    // Should NOT be on any auth page
    expect(currentUrl).not.toMatch(/\/auth/);

    // Should be on /app or /app/dashboard
    expect(currentUrl).toMatch(/\/app/);

    // Refresh - should stay on app
    await page.reload({ waitUntil: 'networkidle' });
    const urlAfterRefresh = page.url();

    expect(urlAfterRefresh).not.toMatch(/\/auth/);
    expect(urlAfterRefresh).toMatch(/\/app/);

    await context.close();
  });
});
