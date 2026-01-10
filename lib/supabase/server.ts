import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getCookieDomain } from "@/lib/supabase/cookie-domain";

// REVERTED: Kept your original function name
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const cookieDomain = getCookieDomain();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              const cookieOptions = cookieDomain ? { ...options, domain: cookieDomain } : options;
              cookieStore.set(name, value, cookieOptions);
            });
          } catch {
            // Safe to ignore in Server Components
          }
        },
      },
    }
  );
}
