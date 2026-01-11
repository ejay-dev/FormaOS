import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureDebugAccess } from "@/app/api/debug/_guard";

export async function GET() {
  const guard = await ensureDebugAccess();
  if (guard) return guard;

  try {
    const admin = createSupabaseAdminClient()

    // Query information_schema.routines for functions mentioning auth.users
    const { data, error } = await admin
      .from('information_schema.routines')
      .select('routine_schema, routine_name, routine_definition')
      .ilike('routine_definition', '%auth.users%')

    if (error) {
      return NextResponse.json({ error: error.message || error }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
