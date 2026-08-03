"use client";

import { useState } from "react";
import { PLAN_CATALOG, type PlanKey } from "@/lib/plans";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";

export default function PlanSelectPage() {
  const [selected, _setSelected] = useState<PlanKey | null>(null);
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

      // If user exists but email is unconfirmed, allow plan selection but surface a note.
      // Supabase may expose `email_confirmed_at` or `confirmed_at` depending on setup.
      const userRecord = user as { email_confirmed_at?: string; confirmed_at?: string };
      const emailConfirmed = userRecord.email_confirmed_at || userRecord.confirmed_at;
      if (!emailConfirmed) {
        // show a non-blocking notice to the user
        setError("Note: your email is unconfirmed. You can still choose a plan and continue.");
        // continue
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
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
      <div className="w-full max-w-4xl rounded-2xl border border-border bg-card p-8">
        <h1 className="text-2xl font-semibold mb-4">Choose a plan</h1>
        <p className="text-sm text-muted-foreground mb-6">Select a plan to continue into the app.</p>

        {error && <div className="mb-4 text-destructive">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.values(PLAN_CATALOG).map((p) => (
            <div key={p.key} className={`rounded-lg border p-4 ${selected === p.key ? "border-primary" : "border-border"}`}>
              <h2 className="font-semibold">{p.name}</h2>
              <p className="text-sm text-muted-foreground">{p.summary}</p>
              <div className="mt-4">
                <button
                  onClick={() => selectPlan(p.key)}
                  disabled={isLoading}
                  className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
