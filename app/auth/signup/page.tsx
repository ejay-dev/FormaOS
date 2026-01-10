"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import { PLAN_CATALOG, resolvePlanKey } from "@/lib/plans";

function SignUpContent() {
  const searchParams = useSearchParams();
  const planParam = resolvePlanKey(searchParams.get("plan"));
  const siteBase = (process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin).replace(/\/$/, "");

  const plan = useMemo(() => (planParam ? PLAN_CATALOG[planParam] : null), [planParam]);

  const signUp = async () => {
    if (!plan) {
      window.location.assign(`${siteBase}/pricing`);
      return;
    }

    const base =
      (process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin).replace(/\/$/, "");

    const supabase = createSupabaseClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${base}/auth/callback?plan=${encodeURIComponent(plan.key)}`,
      },
    });

    if (error) {
      alert(error.message);
      return;
    }

    if (data?.url) {
      window.location.href = data.url;
    }
  };

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#05080f] text-slate-100">
        <div className="max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
          <h1 className="text-2xl font-semibold">Choose a plan to continue</h1>
          <p className="mt-3 text-sm text-slate-400">
            Select the plan that matches your organization and return here to create an account.
          </p>
          <button
            onClick={() => window.location.assign(`${siteBase}/pricing`)}
            className="mt-6 rounded-lg bg-white/10 px-5 py-2 text-sm font-semibold text-slate-100"
          >
            View Plans
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#05080f] text-slate-100">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/5 p-10">
        <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Plan selected</div>
        <h1 className="mt-3 text-3xl font-semibold">{plan.name}</h1>
        <p className="mt-3 text-sm text-slate-300">{plan.summary}</p>
        {plan.key !== "enterprise" ? (
          <p className="mt-2 text-xs text-slate-400">
            14-day free trial. No payment details required at signup.
          </p>
        ) : (
          <p className="mt-2 text-xs text-slate-400">
            Enterprise onboarding is sales-led. We will confirm pricing and rollout after signup.
          </p>
        )}
        <ul className="mt-6 space-y-2 text-sm text-slate-300">
          {plan.features.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-sky-400" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <button
          onClick={signUp}
          className="mt-8 w-full rounded-lg bg-gradient-to-r from-sky-500 via-indigo-500 to-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950"
        >
          Create account with Google
        </button>
        <button
          onClick={() => window.location.assign(`${siteBase}/pricing`)}
          className="mt-4 w-full rounded-lg border border-white/10 px-6 py-3 text-sm font-semibold text-slate-100"
        >
          Change plan
        </button>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#05080f] text-slate-100">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-slate-300">
            Loading signup...
          </div>
        </div>
      }
    >
      <SignUpContent />
    </Suspense>
  );
}
