import { NextResponse } from "next/server";
import { getCookieDomain } from "@/lib/supabase/cookie-domain";

export async function GET(request: Request) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? null;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? null;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? null;
    const anon = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const publishable = Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

    const cookieDomain = getCookieDomain();
    const host = new URL(request.url).hostname;

    return NextResponse.json({
      ok: true,
      env: { appUrl, siteUrl, supabaseUrl, hasAnonKey: anon, hasPublishableKey: publishable },
      cookieDomain,
      requestHost: host,
      note:
        "This endpoint returns no secret values. If cookieDomain does not match your deployed host, set NEXT_PUBLIC_APP_URL or NEXT_PUBLIC_SITE_URL in Vercel and redeploy.",
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
