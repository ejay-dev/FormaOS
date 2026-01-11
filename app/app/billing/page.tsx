import { createSupabaseServerClient } from "@/lib/supabase/server";
import { openCustomerPortal, startCheckout } from "@/app/app/actions/billing";
import { resolvePlanKey, PLAN_CATALOG } from "@/lib/plans";
import { CreditCard, ShieldCheck } from "lucide-react";

type EntitlementRow = {
  feature_key: string;
  enabled: boolean;
  limit_value: number | null;
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: membership } = await supabase
    .from("org_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership?.organization_id) return null;

  const orgId = membership.organization_id as string;

  const { data: organization } = await supabase
    .from("organizations")
    .select("name, plan_key")
    .eq("id", orgId)
    .maybeSingle();

  const planKey = resolvePlanKey(organization?.plan_key ?? null);
  const plan = planKey ? PLAN_CATALOG[planKey] : null;

  const { data: subscription } = await supabase
    .from("org_subscriptions")
    .select("status, current_period_end, trial_expires_at, stripe_customer_id")
    .eq("organization_id", orgId)
    .maybeSingle();

  const { data: entitlements } = await supabase
    .from("org_entitlements")
    .select("feature_key, enabled, limit_value")
    .eq("organization_id", orgId);
  const entitlementRows: EntitlementRow[] = entitlements ?? [];

  const status = resolvedSearchParams?.status;
  const trialEndsAt =
    subscription?.status === "trialing"
      ? subscription.trial_expires_at ?? subscription.current_period_end
      : null;
  const trialExpired =
    subscription?.status === "trialing" &&
    (!trialEndsAt || Date.now() > new Date(trialEndsAt).getTime());
  const canManagePortal = Boolean(subscription?.stripe_customer_id);
  const canSelfServe = subscription?.status === "active" || subscription?.status === "trialing";

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Billing & Plan</h1>
          <p className="text-sm text-slate-400">Manage subscription status and entitlements.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="h-4 w-4" />
          {subscription?.status ?? "not active"}
        </div>
      </header>

      {status === "success" ? (
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          Subscription activated. Entitlements will update shortly.
        </div>
      ) : null}
      {status === "cancelled" ? (
        <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          Checkout cancelled. Your subscription remains inactive.
        </div>
      ) : null}
      {status === "blocked" ? (
        <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          Your subscription is inactive. Activate billing to access the dashboard.
        </div>
      ) : null}
      {status === "missing_customer" ? (
        <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          No billing profile found. Activate a subscription to continue.
        </div>
      ) : null}
      {status === "contact" ? (
        <div className="rounded-xl border border-sky-400/30 bg-sky-500/10 px-4 py-3 text-sm text-sky-200">
          Enterprise plans require a sales-led setup. Contact sales@formaos.com to proceed.
        </div>
      ) : null}
      {trialExpired ? (
        <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          Your trial has expired. Activate a subscription to regain access to paid features.
        </div>
      ) : null}

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center gap-3 text-slate-100">
          <CreditCard className="h-5 w-5 text-sky-300" />
          <div>
            <div className="text-sm uppercase tracking-[0.3em] text-slate-400">Current plan</div>
            <div className="text-xl font-semibold">{plan?.name ?? "Plan not set"}</div>
          </div>
        </div>
        <p className="mt-4 text-sm text-slate-400">
          {plan?.summary ?? "Select a plan to activate billing."}
        </p>
        {planKey === "enterprise" ? (
          <div className="mt-6 space-y-3 text-sm text-slate-300">
            <p>Enterprise billing is handled via assisted onboarding.</p>
            <a
              href="mailto:sales@formaos.com"
              className="inline-flex rounded-lg bg-white/10 px-6 py-3 text-sm font-semibold text-slate-100"
            >
              Contact sales
            </a>
          </div>
        ) : (
          <div className="mt-6 flex flex-wrap gap-3">
            {!canSelfServe ? (
              <form action={startCheckout}>
                <input type="hidden" name="plan" value={planKey ?? ""} />
                <button
                  type="submit"
                  className="rounded-lg bg-gradient-to-r from-sky-500 via-indigo-500 to-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950"
                >
                  Activate subscription
                </button>
              </form>
            ) : null}
            {canManagePortal ? (
              <form action={openCustomerPortal}>
                <button
                  type="submit"
                  className="rounded-lg border border-white/15 px-6 py-3 text-sm font-semibold text-slate-100"
                >
                  Manage billing
                </button>
              </form>
            ) : null}
          </div>
        )}
        {trialEndsAt && !trialExpired ? (
          <div className="mt-4 text-xs text-slate-400">
            Trial active until {new Date(trialEndsAt).toLocaleDateString()}.
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="text-sm uppercase tracking-[0.3em] text-slate-400">Entitlements</div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {entitlementRows.map((entitlement) => (
            <div
              key={entitlement.feature_key}
              className="rounded-xl border border-white/10 bg-[hsl(var(--card))] px-4 py-3 text-sm text-slate-200"
            >
              <div className="font-semibold">{entitlement.feature_key}</div>
              <div className="text-xs text-slate-400">
                {entitlement.enabled ? "Enabled" : "Disabled"}
                {entitlement.limit_value ? ` · Limit ${entitlement.limit_value}` : ""}
              </div>
            </div>
          ))}
          {entitlementRows.length === 0 ? (
            <div className="text-sm text-slate-400">No entitlements active yet.</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
