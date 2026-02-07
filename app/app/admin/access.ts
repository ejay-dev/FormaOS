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
    console.error("[requireFounderAccess] ❌ No user found");
    throw new Error("Unauthorized");
  }

  const allowedEmails = parseEnvList(process.env.FOUNDER_EMAILS);
  const allowedIds = parseEnvList(process.env.FOUNDER_USER_IDS);

  if (!allowedEmails.size && !allowedIds.size) {
    console.error("[requireFounderAccess] ⚠️ CRITICAL: Founder access not configured", {
      hasFounderEmails: false,
      hasFounderIds: false,
      nodeEnv: process.env.NODE_ENV,
    });
    throw new Error("Founder access not configured");
  }

  const email = user.email?.trim().toLowerCase() ?? "";
  const hasEmailAccess = email ? allowedEmails.has(email) : false;
  const hasIdAccess = allowedIds.has(user.id.toLowerCase());

  console.log("[requireFounderAccess] Checking founder access", {
    email: email ? email.substring(0, 5) + "***" : "none",
    userId: user.id.substring(0, 8) + "...",
    hasEmailAccess,
    hasIdAccess,
    allowedEmailsCount: allowedEmails.size,
    allowedIdsCount: allowedIds.size,
  });

  if (!hasEmailAccess && !hasIdAccess) {
    console.error("[requireFounderAccess] ❌ Access denied - not a founder", {
      email,
      userId: user.id,
    });
    throw new Error("Forbidden");
  }

  console.log("[requireFounderAccess] ✅ Founder access granted", { 
    email: email ? email.substring(0, 5) + "***" : "none",
    timestamp: new Date().toISOString(),
  });
  return { user };
}
