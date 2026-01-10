"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  
  // 1. Clear the Auth Session
  await supabase.auth.signOut();
  
  // 2. Force redirect to entry point
  redirect("/auth/signin");
}
