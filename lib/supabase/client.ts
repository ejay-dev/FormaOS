import { createBrowserClient } from "@supabase/ssr";

type SupabaseClient = ReturnType<typeof createBrowserClient>;

let cachedClient: SupabaseClient | null = null;

function getSupabaseKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    ""
  );
}

function requireSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = getSupabaseKey();
  if (!url || !key) {
    throw new Error(
      "Supabase public URL or anon key is missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }
  return { url, key };
}

export function createSupabaseClient() {
  if (cachedClient) return cachedClient;
  const { url, key } = requireSupabaseConfig();
  cachedClient = createBrowserClient(url, key);
  return cachedClient;
}
