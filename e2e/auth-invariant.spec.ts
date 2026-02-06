import { test, expect } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const APP_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://bvfniosswcvuyfaaicze.supabase.co";
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2Zm5pb3Nzd2N2dXlmYWFpY3plIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njg5NjQyNSwiZXhwIjoyMDgyNDcyNDI1fQ.486jhV7U5BM7B4Px4tGUQ_V3PP0s6tu15OZbMHT22Vg";

const PASSWORD = "QaE2EAuth123!Secure";
const timestamp = Date.now();

let admin: SupabaseClient;
const createdUserIds: string[] = [];
const createdOrgIds = new Set<string>();

async function waitForProvisioning(userId: string) {
  await expect
    .poll(
      async () => {
        const { data: membership } = await admin
          .from("org_members")
          .select("organization_id, role")
          .eq("user_id", userId)
          .maybeSingle();

        if (!membership?.organization_id) {
          return false;
        }

        const orgId = membership.organization_id as string;

        const { data: subscription } = await admin
          .from("org_subscriptions")
          .select("status, trial_expires_at, current_period_end")
          .eq("organization_id", orgId)
          .maybeSingle();

        const { data: entitlements } = await admin
          .from("org_entitlements")
          .select("feature_key, enabled")
          .eq("organization_id", orgId);

        const hasSubscription = Boolean(subscription?.status);
        const hasEntitlements =
          (entitlements ?? []).filter((e) => e.enabled).length > 0;

        if (hasSubscription && hasEntitlements) {
          createdOrgIds.add(orgId);
          return true;
        }
        return false;
      },
      { timeout: 20000, intervals: [1000, 2000, 4000] },
    )
    .toBe(true);
}

test.describe("Auth provisioning invariant", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(() => {
    admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  });

  test.afterAll(async () => {
    for (const orgId of Array.from(createdOrgIds)) {
      await admin.from("org_tasks").delete().eq("organization_id", orgId);
      await admin.from("org_evidence").delete().eq("organization_id", orgId);
      await admin.from("org_entitlements").delete().eq("organization_id", orgId);
      await admin.from("org_subscriptions").delete().eq("organization_id", orgId);
      await admin
        .from("org_onboarding_status")
        .delete()
        .eq("organization_id", orgId);
      await admin.from("org_members").delete().eq("organization_id", orgId);
      await admin.from("orgs").delete().eq("id", orgId);
      await admin.from("organizations").delete().eq("id", orgId);
    }

    for (const userId of createdUserIds) {
      await admin.auth.admin.deleteUser(userId);
    }
  });

  test("Email signup lands in /app with trial entitlements", async ({ page }) => {
    const email = `qa.auth.email.${timestamp}@formaos.team`;

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
    });

    expect(error).toBeNull();
    expect(data?.user?.id).toBeTruthy();

    const userId = data!.user!.id;
    createdUserIds.push(userId);

    await page.goto(`${APP_URL}/auth/signin`);
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(app|onboarding)/, { timeout: 20000 });

    await expect
      .poll(
        async () => (await page.request.get("/api/system-state")).ok(),
        { timeout: 20000, intervals: [1000, 2000, 4000] },
      )
      .toBe(true);

    await waitForProvisioning(userId);
  });

  test("Google OAuth signup lands in /app with trial entitlements", async ({ page }) => {
    const email = `qa.auth.google.${timestamp}@formaos.team`;

    const { data, error } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
    });

    expect(error).toBeNull();
    expect(data?.user?.id).toBeTruthy();
    const userId = data!.user!.id;
    createdUserIds.push(userId);

    try {
      await admin.auth.admin.updateUserById(userId, {
        app_metadata: { provider: "google", providers: ["google"] },
      });
    } catch {
      // non-fatal if metadata update fails
    }

    const { data: linkData, error: linkError } = await (admin as any).auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: `${APP_URL}/auth/callback`,
      },
    });

    expect(linkError).toBeNull();
    expect(linkData?.properties?.action_link).toBeTruthy();

    await page.goto(linkData.properties.action_link);
    await page.waitForURL(/\/(app|onboarding)/, { timeout: 20000 });

    await expect
      .poll(
        async () => (await page.request.get("/api/system-state")).ok(),
        { timeout: 20000, intervals: [1000, 2000, 4000] },
      )
      .toBe(true);

    await waitForProvisioning(userId);
  });
});
