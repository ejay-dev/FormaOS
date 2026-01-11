import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getCookieDomain } from "@/lib/supabase/cookie-domain";

export async function middleware(request: NextRequest) {
  console.log("MIDDLEWARE HIT:", request.nextUrl.pathname);
  try {
    let response = NextResponse.next({ request });

    const pathname = request.nextUrl.pathname;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    const safeUrl = (value?: string) => {
      if (!value) return null;
      try {
        return new URL(value);
      } catch {
        return null;
      }
    };
    const appOrigin = safeUrl(appUrl);
    const siteOrigin = safeUrl(siteUrl);
    const host = request.nextUrl.hostname;

    const oauthCode = request.nextUrl.searchParams.get("code");
    if (oauthCode && pathname === "/") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/auth/callback";
      if (appOrigin) {
        redirectUrl.protocol = appOrigin.protocol;
        redirectUrl.host = appOrigin.host;
      }
      return NextResponse.redirect(redirectUrl);
    }

  if (appOrigin && siteOrigin && appOrigin.hostname !== siteOrigin.hostname) {
    const appPaths = ["/app", "/auth", "/onboarding", "/accept-invite", "/submit", "/signin", "/api"];
    const isAppPath = appPaths.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );

    if (host === siteOrigin.hostname && isAppPath) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.protocol = appOrigin.protocol;
      redirectUrl.host = appOrigin.host;
      return NextResponse.redirect(redirectUrl);
    }

    if (host === appOrigin.hostname && !isAppPath && !pathname.startsWith("/api")) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.protocol = siteOrigin.protocol;
      redirectUrl.host = siteOrigin.host;
      return NextResponse.redirect(redirectUrl);
    }
  }

  const cookieDomain = getCookieDomain();
    const isPresent = (value?: string | null) =>
      Boolean(value && value !== "undefined" && value !== "null");
    const supabaseUrl = isPresent(process.env.NEXT_PUBLIC_SUPABASE_URL)
      ? process.env.NEXT_PUBLIC_SUPABASE_URL
      : "";
    const supabaseAnonKey = isPresent(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      : "";
    const hasValidSupabaseUrl = (() => {
      if (!supabaseUrl) return false;
      try {
        new URL(supabaseUrl);
        return true;
      } catch {
        return false;
      }
    })();
    const hasSupabaseEnv = Boolean(hasValidSupabaseUrl && supabaseAnonKey);

    if (!hasSupabaseEnv) {
      if (pathname.startsWith("/app")) {
        const url = request.nextUrl.clone();
        url.pathname = "/auth/signin";
        return NextResponse.redirect(url);
      }
      return response;
    }

  let user: { id: string; email?: string | null } | null = null;
  let supabase: ReturnType<typeof createServerClient> | null = null;

    if (hasSupabaseEnv) {
      try {
        supabase = createServerClient(supabaseUrl!, supabaseAnonKey!, {
          cookies: {
            getAll: () => request.cookies.getAll(),
            setAll: (cookiesToSet) => {
              try {
                cookiesToSet.forEach(({ name, value, options }) => {
                  const cookieOptions = cookieDomain ? { ...options, domain: cookieDomain } : options;
                  request.cookies.set(name, value);
                  response.cookies.set(name, value, cookieOptions);
                });
              } catch {
                // Ignore cookie set errors in middleware
              }
            },
          },
        });

        const { data, error } = await supabase.auth.getUser();
        if (!error) {
          user = data.user ?? null;
        }
      } catch (error) {
        console.error("[Middleware] Supabase init failed:", error);
        supabase = null;
        user = null;
      }
    }

    // -------------------------------
    // 1. BLOCK PROTECTED ROUTES IF NOT LOGGED IN
    // -------------------------------
    if (!user && pathname.startsWith("/app")) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/signin";
      return NextResponse.redirect(url);
    }

    // -------------------------------
    // 2. BLOCK AUTH PAGES IF LOGGED IN (with onboarding check)
    // -------------------------------
    if (user && pathname.startsWith("/auth")) {
      // Check if user has completed onboarding
      const { data: membership } = await supabase
        .from("org_members")
        .select("organization_id, organizations(onboarding_completed)")
        .eq("user_id", user.id)
        .maybeSingle();

      const orgRecord = Array.isArray(membership?.organizations)
        ? membership.organizations[0]
        : membership?.organizations;

      const onboardingCompleted = Boolean(orgRecord?.onboarding_completed);

      const url = request.nextUrl.clone();
      
      // If onboarding is not completed, redirect to onboarding
      if (!onboardingCompleted && membership?.organization_id) {
        url.pathname = "/onboarding";
        return NextResponse.redirect(url);
      }
      
      // Otherwise, redirect to app
      url.pathname = "/app";
      return NextResponse.redirect(url);
    }

    // -------------------------------
    // 2b. ROLE-BASED DASHBOARD GUARD
    // -------------------------------
    if (user && supabase && pathname.startsWith("/app") && !pathname.startsWith("/app/api")) {
      const { data: membership } = await supabase
        .from("org_members")
        .select("organization_id, role")
        .eq("user_id", user.id)
        .maybeSingle();

      const role = (membership?.role ?? "").toLowerCase();
      const isStaff = role === "staff" || role === "member";
      const orgId = membership?.organization_id ?? null;

      if (isStaff) {
        const allowedPrefixes = [
          "/app/staff",
          "/app/tasks",
          "/app/patients",
          "/app/progress-notes",
          "/app/vault",
          "/app/evidence",
          "/app/accept-invite",
        ];

        const allowed = allowedPrefixes.some(
          (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
        );

        if (!allowed) {
          const url = request.nextUrl.clone();
          url.pathname = "/app/staff";
          return NextResponse.redirect(url);
        }
      }

      const billingAllowed =
        pathname.startsWith("/app/billing") || pathname.startsWith("/app/accept-invite");

      if (orgId && !billingAllowed) {
            // Allow founders (listed via env) to bypass billing/trial gating
            const parseEnvList = (value?: string | null) =>
              new Set(
                (value ?? "")
                  .split(",")
                  .map((entry) => entry.trim().toLowerCase())
                  .filter(Boolean)
              );

            const founderEmails = parseEnvList(process.env.FOUNDER_EMAILS);
            const founderIds = parseEnvList(process.env.FOUNDER_USER_IDS);
            const userEmail = (user.email ?? "").toLowerCase();
            const isFounder = Boolean(
              (userEmail && founderEmails.has(userEmail)) || founderIds.has(user.id.toLowerCase())
            );

            if (isFounder) {
              console.log("[middleware] founder bypass for user:", { id: user.id, email: userEmail });
              // skip subscription gating for founders
            } else {
        const { data: subscription, error: subscriptionError } = await supabase
          .from("org_subscriptions")
          .select("status, current_period_end")
          .eq("organization_id", orgId)
          .maybeSingle();

        let subscriptionActive = false;

        if (!subscriptionError && subscription?.status) {
          if (subscription.status === "active") {
            subscriptionActive = true;
          } else if (subscription.status === "trialing") {
            if (subscription.current_period_end) {
              const trialEnd = new Date(subscription.current_period_end).getTime();
              subscriptionActive = !Number.isNaN(trialEnd) && Date.now() <= trialEnd;
            }
          }
        }

        if (!isFounder && !subscriptionActive) {
          const url = request.nextUrl.clone();
          url.pathname = "/app/billing";
          url.searchParams.set("status", "blocked");
          return NextResponse.redirect(url);
        }
        }
      }
    }

    // -------------------------------
    // 3. SECURITY HEADERS
    // -------------------------------
    // Add security headers to all responses
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co;"
    );

    // -------------------------------
    // 5. ALLOW ONBOARDING ALWAYS
    // -------------------------------
    // No redirects here. Onboarding is handled inside the app.
    return response;
  } catch (err) {
    console.error("Middleware runtime error:", err);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes that are explicitly public
     */
    "/((?!_next/static|_next/image|favicon.ico|public/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2)$).*)",
  ],
};
