import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureSubscription } from "@/lib/billing/subscriptions";
import { resolvePlanKey, type PlanKey } from "@/lib/plans";

const DEFAULT_PLAN: PlanKey = "basic";

type ProvisionResult = {
  ok: boolean;
  orgId?: string;
  planKey?: PlanKey | null;
  actions: string[];
  error?: string;
};

type EnsureOrgInput = {
  orgId: string;
  planKey?: string | null;
  ownerUserId?: string | null;
  orgName?: string | null;
};

type EnsureUserInput = {
  userId: string;
  email?: string | null;
  planKey?: string | null;
};

async function ensureLegacyOrg(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  orgId: string,
  name: string,
  createdBy: string | null,
  nowIso: string,
  actions: string[],
) {
  try {
    const { error } = await admin.from("orgs").upsert(
      {
        id: orgId,
        name,
        created_by: createdBy ?? null,
        created_at: nowIso,
        updated_at: nowIso,
      },
      { onConflict: "id" },
    );
    if (!error) {
      actions.push("legacy_org_upserted");
    }
  } catch (error) {
    console.error("[provisioning] legacy org upsert failed:", error);
  }
}

async function ensureOnboardingStatus(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  orgId: string,
  nowIso: string,
  actions: string[],
) {
  try {
    const { data } = await admin
      .from("org_onboarding_status")
      .select("organization_id")
      .eq("organization_id", orgId)
      .maybeSingle();

    if (!data?.organization_id) {
      const { error } = await admin.from("org_onboarding_status").insert({
        organization_id: orgId,
        current_step: 1,
        completed_steps: [],
        updated_at: nowIso,
      });
      if (!error) {
        actions.push("onboarding_status_created");
      }
    }
  } catch (error) {
    console.error("[provisioning] onboarding status check failed:", error);
  }
}

export async function ensureOrgProvisioning(
  input: EnsureOrgInput,
): Promise<ProvisionResult> {
  const actions: string[] = [];
  const admin = createSupabaseAdminClient();
  const nowIso = new Date().toISOString();

  const { data: org } = await admin
    .from("organizations")
    .select("id, name, plan_key, created_by")
    .eq("id", input.orgId)
    .maybeSingle();

  let resolvedOrg = org;
  if (!resolvedOrg && input.ownerUserId) {
    const orgName = input.orgName?.trim() || "Organization";
    const resolvedPlan =
      resolvePlanKey(input.planKey ?? null) ?? DEFAULT_PLAN;
    const { data: createdOrg, error } = await admin
      .from("organizations")
      .insert({
        id: input.orgId,
        name: orgName,
        created_by: input.ownerUserId,
        plan_key: resolvedPlan,
        plan_selected_at: nowIso,
        onboarding_completed: false,
      })
      .select("id, name, plan_key, created_by")
      .single();

    if (error || !createdOrg) {
      return {
        ok: false,
        actions,
        error: "organization_create_failed",
      };
    }

    resolvedOrg = createdOrg;
    actions.push("org_created");
  }

  if (!resolvedOrg) {
    return { ok: false, actions, error: "organization_not_found" };
  }

  const resolvedPlan =
    resolvePlanKey(input.planKey ?? resolvedOrg.plan_key ?? null) ??
    DEFAULT_PLAN;

  if (!resolvedOrg.plan_key) {
    await admin
      .from("organizations")
      .update({ plan_key: resolvedPlan, plan_selected_at: nowIso })
      .eq("id", resolvedOrg.id);
    actions.push("plan_backfilled");
  }

  await ensureLegacyOrg(
    admin,
    resolvedOrg.id,
    resolvedOrg.name ?? "Organization",
    resolvedOrg.created_by ?? input.ownerUserId ?? null,
    nowIso,
    actions,
  );
  await ensureOnboardingStatus(admin, resolvedOrg.id, nowIso, actions);

  try {
    await ensureSubscription(resolvedOrg.id, resolvedPlan);
    actions.push("subscription_ensured");
  } catch (error) {
    console.error("[provisioning] ensureSubscription failed:", error);
  }

  return {
    ok: true,
    orgId: resolvedOrg.id,
    planKey: resolvedPlan,
    actions,
  };
}

export async function ensureUserProvisioning(
  input: EnsureUserInput,
): Promise<ProvisionResult> {
  const actions: string[] = [];
  const admin = createSupabaseAdminClient();
  const nowIso = new Date().toISOString();

  const { data: membership } = await admin
    .from("org_members")
    .select("organization_id, role")
    .eq("user_id", input.userId)
    .maybeSingle();

  let orgId = membership?.organization_id ?? null;
  let resolvedPlan = resolvePlanKey(input.planKey ?? null) ?? DEFAULT_PLAN;
  let orgName: string | null = null;

  if (!orgId) {
    const { data: userData } = await (admin as any).auth.admin.getUserById(
      input.userId,
    );
    const userEmail =
      input.email ??
      userData?.user?.email ??
      `user-${input.userId.slice(0, 8)}`;
    const userName =
      userData?.user?.user_metadata?.full_name ??
      userData?.user?.user_metadata?.name ??
      userEmail.split("@")[0];
    const planFromMetadata = resolvePlanKey(
      userData?.user?.user_metadata?.selected_plan ?? null,
    );
    resolvedPlan = planFromMetadata ?? resolvedPlan;
    orgName = `${userName}'s Organization`;

    const { data: createdOrg, error } = await admin
      .from("organizations")
      .insert({
        name: orgName,
        created_by: input.userId,
        plan_key: resolvedPlan,
        plan_selected_at: nowIso,
        onboarding_completed: false,
      })
      .select("id, name")
      .single();

    if (error || !createdOrg?.id) {
      return { ok: false, actions, error: "organization_create_failed" };
    }

    orgId = createdOrg.id;
    actions.push("org_created");

    const { error: memberError } = await admin.from("org_members").insert({
      organization_id: orgId,
      user_id: input.userId,
      role: "owner",
    });

    if (memberError) {
      return { ok: false, actions, error: "membership_create_failed" };
    }

    actions.push("membership_created");
  } else if (!membership?.role) {
    await admin
      .from("org_members")
      .update({ role: "member" })
      .eq("organization_id", orgId)
      .eq("user_id", input.userId);
    actions.push("role_backfilled");
  }

  if (!orgId) {
    return { ok: false, actions, error: "organization_missing" };
  }

  const orgResult = await ensureOrgProvisioning({
    orgId,
    planKey: resolvedPlan,
    ownerUserId: input.userId,
    orgName,
  });

  return {
    ok: orgResult.ok,
    orgId: orgResult.orgId,
    planKey: orgResult.planKey,
    actions: [...actions, ...orgResult.actions],
    error: orgResult.error,
  };
}
