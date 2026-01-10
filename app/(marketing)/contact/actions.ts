"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function safeValue(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

export async function submitMarketingLead(formData: FormData) {
  const name = safeValue(formData.get("name"));
  const email = safeValue(formData.get("email"));
  const organization = safeValue(formData.get("organization"));
  const industry = safeValue(formData.get("industry"));
  const message = safeValue(formData.get("message"));

  if (!name || !email || !organization || !message) {
    redirect("/contact?error=1");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("marketing_leads").insert({
    name,
    email,
    organization,
    industry: industry || null,
    message,
  });

  if (error) {
    redirect("/contact?error=1");
  }

  redirect("/contact?success=1");
}
