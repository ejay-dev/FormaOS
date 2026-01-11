import { createSupabaseServerClient } from "@/lib/supabase/server";

function parseEnvList(value?: string | null) {
  return new Set(
    (value ?? "")
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean)
  );
}

export async function requireFounderAccess() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const allowedEmails = parseEnvList(process.env.FOUNDER_EMAILS);
  const allowedIds = parseEnvList(process.env.FOUNDER_USER_IDS);

  // Debug logging to help diagnose founder access problems (server-side only)
  try {
    console.log("[requireFounderAccess] user:", { id: user.id, email: user.email });
    console.log("[requireFounderAccess] FOUNDER_EMAILS:", process.env.FOUNDER_EMAILS);
    console.log("[requireFounderAccess] FOUNDER_USER_IDS:", process.env.FOUNDER_USER_IDS);
  } catch (e) {
    // ignore logging failures
  }

  if (!allowedEmails.size && !allowedIds.size) {
    throw new Error("Founder access not configured");
  }

  const email = user.email?.toLowerCase() ?? "";
  const hasEmailAccess = email ? allowedEmails.has(email) : false;
  const hasIdAccess = allowedIds.has(user.id.toLowerCase());

  // If the user is explicitly listed as a founder by email or id, allow access
  if (hasEmailAccess || hasIdAccess) {
    console.log("[requireFounderAccess] founder bypass granted", { id: user.id, email });
    return { user };
  }

  // Otherwise require they be a member with owner/admin role
  const { data: membership } = await supabase
    .from("org_members")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  const role = (membership?.role ?? "").toLowerCase();
  if (role !== "owner" && role !== "admin") {
    throw new Error("Forbidden");
  }

  return { user };
}
