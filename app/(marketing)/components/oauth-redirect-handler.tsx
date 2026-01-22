"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { brand } from "@/config/brand";

export function OAuthRedirectHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    
    if (code) {
      // OAuth code detected on homepage - redirect to callback
      const plan = searchParams.get("plan");
      const appBase = brand.seo.appUrl.replace(/\/$/, "");
      const planParam = plan ? `&plan=${encodeURIComponent(plan)}` : "";
      
      console.log("OAuth code detected on homepage, redirecting to callback...");
      window.location.href = `${appBase}/auth/callback?code=${encodeURIComponent(code)}${planParam}`;
    }
  }, [searchParams]);

  return null;
}
