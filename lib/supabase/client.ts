import { createBrowserClient } from "@supabase/ssr";

function getSupabaseKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Keep this for existing code
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  getSupabaseKey()
);

// ✅ ADD THIS FUNCTION (This fixes the red line in invite-button.tsx)
export function createSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    getSupabaseKey()
  );
}