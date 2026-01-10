import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getCookieDomain } from "@/lib/supabase/cookie-domain";

// REVERTED: Kept your original function name
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const cookieDomain = getCookieDomain();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
    return createFallbackSupabaseClient();
  }

  try {
    return createServerClient(supabaseUrl, supabaseKey, {
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
    });
  } catch (error) {
    console.error("[Supabase] Failed to initialize server client:", error);
    return createFallbackSupabaseClient();
  }
}

function createFallbackSupabaseClient() {
  const error = { message: "Supabase is not configured." };
  const emptyResult = { data: null, error };
  const emptyListResult = { data: [], error };

  const buildQuery = (result = emptyListResult) => {
    const builder: any = {
      select: () => buildQuery(emptyListResult),
      insert: () => buildQuery(emptyResult),
      update: () => buildQuery(emptyResult),
      delete: () => buildQuery(emptyResult),
      upsert: () => buildQuery(emptyResult),
      eq: () => builder,
      ilike: () => builder,
      limit: () => builder,
      order: () => builder,
      match: () => builder,
      in: () => builder,
      not: () => builder,
      gt: () => builder,
      gte: () => builder,
      lt: () => builder,
      lte: () => builder,
      single: () => Promise.resolve(emptyResult),
      maybeSingle: () => Promise.resolve(emptyResult),
      then: (resolve: (value: typeof result) => void) => Promise.resolve(result).then(resolve),
      catch: (reject: (reason?: unknown) => void) => Promise.resolve(result).catch(reject),
      finally: (callback: () => void) => Promise.resolve(result).finally(callback),
    };
    return builder;
  };

  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error }),
      getSession: async () => ({ data: { session: null }, error }),
      refreshSession: async () => ({ data: { session: null }, error }),
      exchangeCodeForSession: async () => ({ data: { user: null, session: null }, error }),
      updateUser: async () => ({ data: null, error }),
      signOut: async () => ({ error }),
    },
    from: () => buildQuery(),
    rpc: async () => emptyResult,
    storage: {
      from: () => ({
        upload: async () => emptyResult,
        remove: async () => emptyResult,
        createSignedUrl: async () => emptyResult,
        getPublicUrl: () => ({ data: { publicUrl: "" }, error }),
        download: async () => emptyResult,
      }),
    },
  } as any;
}
