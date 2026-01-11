"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export function OAuthRedirectHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    
    if (code) {
      // OAuth code detected on homepage - redirect to callback
      const plan = searchParams.get("plan");
      const appBase = (process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin).replace(/\/$/, "");
      const planParam = plan ? `&plan=${encodeURIComponent(plan)}` : "";
      
      console.log("OAuth code detected on homepage, redirecting to callback...");
      window.location.href = `${appBase}/auth/callback?code=${encodeURIComponent(code)}${planParam}`;
    }
  }, [searchParams]);

  return null;
}
