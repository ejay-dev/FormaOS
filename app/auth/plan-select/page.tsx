"use client";

import { useState } from "react";
import { PLAN_CATALOG, type PlanKey } from "@/lib/plans";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";

export default function PlanSelectPage() {
  const [selected, setSelected] = useState<PlanKey | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const selectPlan = async (plan: PlanKey) => {
    setError(null);
    setIsLoading(true);

    try {
      // Ensure user is signed in client-side
      const supabase = createSupabaseClient();
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        setError("You must be signed in to select a plan. Please sign in or complete email confirmation.");
        setIsLoading(false);
        return;
      }

      // Call server API to create org and subscription
      const res = await fetch("/api/onboarding/select-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || "Failed to select plan");
        setIsLoading(false);
        return;
      }

      // Redirect to returned location
      router.push(json.redirect || "/app");
    } catch (err: any) {
      setError(String(err));
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#05080f] text-slate-100 p-6">
      <div className="w-full max-w-4xl rounded-2xl border border-white/10 bg-white/5 p-8">
        <h2 className="text-2xl font-semibold mb-4">Choose a plan</h2>
        <p className="text-sm text-slate-400 mb-6">Select a plan to continue into the app.</p>

        {error && <div className="mb-4 text-rose-300">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.values(PLAN_CATALOG).map((p) => (
            <div key={p.key} className={`rounded-lg border p-4 ${selected === p.key ? "border-sky-400" : "border-white/10"}`}>
              <h3 className="font-semibold">{p.name}</h3>
              <p className="text-sm text-slate-400">{p.summary}</p>
              <div className="mt-4">
                <button
                  onClick={() => selectPlan(p.key)}
                  disabled={isLoading}
                  className="rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold"
                >
                  Choose {p.name}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
