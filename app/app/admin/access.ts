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
    console.log("[requireFounderAccess] ❌ No user found");
    throw new Error("Unauthorized");
  }

  const allowedEmails = parseEnvList(process.env.FOUNDER_EMAILS);
  const allowedIds = parseEnvList(process.env.FOUNDER_USER_IDS);

  if (!allowedEmails.size && !allowedIds.size) {
    console.log("[requireFounderAccess] ⚠️ No founder emails or IDs configured");
    throw new Error("Founder access not configured");
  }

  const email = user.email?.trim().toLowerCase() ?? "";
  const hasEmailAccess = email ? allowedEmails.has(email) : false;
  const hasIdAccess = allowedIds.has(user.id.toLowerCase());

  console.log("[requireFounderAccess] Checking founder access", {
    email,
    userId: user.id.substring(0, 8),
    hasEmailAccess,
    hasIdAccess,
    allowedEmailsCount: allowedEmails.size,
    allowedIdsCount: allowedIds.size,
  });

  if (!hasEmailAccess && !hasIdAccess) {
    console.log("[requireFounderAccess] ❌ Access denied - not a founder");
    throw new Error("Forbidden");
  }

  console.log("[requireFounderAccess] ✅ Founder access granted", { email });
  return { user };
}
