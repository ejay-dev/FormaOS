"use client";

import { Suspense } from "react";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

function AuthRedirectContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    const plan = searchParams.get("plan");
    // Forward every parameter the OAuth provider returned, not just `code`.
    // Previously this route silently dropped `state`, which the canonical
    // /auth/callback route validates against a cookie — so a Google OAuth
    // client misconfigured to redirect here would always fail the state
    // check on the canonical route. Forward `state`, `error`, and any
    // provider-specific params so the canonical handler can decide.
    if (!code) return;

    const appBase = (
      process.env.NEXT_PUBLIC_APP_URL ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      window.location.origin
    ).replace(/\/$/, "");

    const params = new URLSearchParams();
    params.set("code", code);
    const state = searchParams.get("state");
    if (state) params.set("state", state);
    if (plan) params.set("plan", plan);
    const error = searchParams.get("error");
    if (error) params.set("error", error);
    const errorDescription = searchParams.get("error_description");
    if (errorDescription) params.set("error_description", errorDescription);
    const provider = searchParams.get("provider");
    if (provider) params.set("provider", provider);

    window.location.href = `${appBase}/auth/callback?${params.toString()}`;
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] text-slate-100">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-sky-400 border-r-transparent"></div>
        <p className="mt-4 text-sm text-slate-400">Completing sign in...</p>
      </div>
    </div>
  );
}

export default function AuthRedirectPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] text-slate-100">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-sky-400 border-r-transparent"></div>
          <p className="mt-4 text-sm text-slate-400">Loading...</p>
        </div>
      </div>
    }>
      <AuthRedirectContent />
    </Suspense>
  );
}
