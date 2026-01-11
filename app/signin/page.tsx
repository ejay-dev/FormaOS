"use client";

import { useState } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";

export default function SignInPage() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const signIn = async () => {
    setErrorMessage(null);
    const base =
      (process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin).replace(/\/$/, "");

    const supabase = createSupabaseClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${base}/auth/callback`,
      },
    });

    if (error) {
      // show non-blocking inline message instead of window.alert
      setErrorMessage(error.message ?? "An unexpected error occurred.");
      return;
    }

    if (data?.url) {
      window.location.href = data.url;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={signIn}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white rounded-lg"
        >
          Sign in with Google
        </button>

        {errorMessage && (
          <div className="max-w-xs text-center rounded-md border border-card-foreground/8 bg-card/8 px-4 py-3 text-sm text-muted">
            <strong className="block font-semibold text-card-foreground">{errorMessage}</strong>
            <p className="mt-1 text-[13px] text-muted/80">
              If this is unexpected, ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
              are configured in your environment (Vercel project settings or .env.local).
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
