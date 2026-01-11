import { NextResponse } from "next/server";

// Safe debug endpoint: returns boolean flags indicating presence of Supabase env vars
// Do NOT return actual secret values.
export async function GET() {
  try {
    const hasUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
    const hasAnon = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const hasPublishable = Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
    const hasAny = hasUrl && (hasAnon || hasPublishable);

    return NextResponse.json({
      ok: true,
      detected: {
        hasUrl,
        hasAnon,
        hasPublishable,
        hasAny,
      },
      note: "This endpoint only reports presence of env vars, not their values. Redeploy required after changing Vercel env vars.",
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
