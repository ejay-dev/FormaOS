"use client";

import { Suspense } from "react";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

function AuthRedirectContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    const plan = searchParams.get("plan");
    
    if (code) {
      // Redirect to the proper callback route with the code
      const appBase = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin).replace(/\/$/, "");
      const planParam = plan ? `&plan=${encodeURIComponent(plan)}` : "";
      window.location.href = `${appBase}/auth/callback?code=${encodeURIComponent(code)}${planParam}`;
    }
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
