"use client";

import { supabase } from "@/lib/supabase/client";

export default function SignInPage() {
  const signIn = async () => {
    const base =
      (process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin).replace(/\/$/, "");

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${base}/auth/callback`,
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

  return (
    <div className="min-h-screen flex items-center justify-center">
      <button
        onClick={signIn}
        className="px-6 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white rounded-lg"
      >
        Sign in with Google
      </button>
    </div>
  );
}
