import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getCookieDomain } from "@/lib/supabase/cookie-domain";
import { isFounder } from "@/lib/utils/founder";

export async function middleware(request: NextRequest) {
  try {
    let response = NextResponse.next({ request });

    const pathname = request.nextUrl.pathname;
    
    // 🚨 CRITICAL: Verify FOUNDER_EMAILS is loaded (log ONCE per deployment)
    if (pathname === "/admin" || pathname.startsWith("/admin/")) {
      console.log("[Middleware] 🔧 ENV CHECK", {
        FOUNDER_EMAILS_RAW: process.env.FOUNDER_EMAILS,
        FOUNDER_USER_IDS_RAW: process.env.FOUNDER_USER_IDS,
        NODE_ENV: process.env.NODE_ENV,
      });
    }
    
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
    const appPaths = ["/app", "/admin", "/auth", "/onboarding", "/accept-invite", "/submit", "/signin", "/api"];
    const isAppPath = appPaths.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );

    // Ensure /admin always stays on app domain
    if (pathname.startsWith("/admin") && host === siteOrigin.hostname) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.protocol = appOrigin.protocol;
      redirectUrl.host = appOrigin.host;
      return NextResponse.redirect(redirectUrl);
    }

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
      if (pathname.startsWith("/app") || pathname.startsWith("/admin")) {
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

    // ============================================================
    // 🚨 STEP 1: DETECT FOUNDER - ABSOLUTE TOP PRIORITY
    // This MUST run before ANY other routing logic
    // ============================================================
    
    const userEmail = user?.email ?? "";
    const userId = user?.id ?? "";
    const isUserFounder = isFounder(userEmail, userId);
    
    // 🔍 FOUNDER DETECTION LOGGING (for /admin paths only)
    if (pathname.startsWith("/admin")) {
      console.log("[Middleware] 🔍 FOUNDER CHECK", {
        pathname,
        userEmail: userEmail ? userEmail.substring(0, 3) + "***" : "none",
        userId: userId ? userId.substring(0, 8) + "..." : "none",
        isFounder: isUserFounder,
        hasUser: !!user,
      });
    }

    // ============================================================
    // 🚨 STEP 2: SHORT-CIRCUIT /admin FOR FOUNDERS
    // If founder accessing /admin → ALLOW IMMEDIATELY, bypass ALL guards
    // ============================================================
    if (pathname.startsWith("/admin")) {
      if (!user) {
        // Not authenticated → redirect to signin
        console.log("[Middleware] ❌ /admin requires authentication");
        const url = request.nextUrl.clone();
        url.pathname = "/auth/signin";
        return NextResponse.redirect(url);
      }
      
      if (isUserFounder) {
        // ✅ FOUNDER → ALLOW ACCESS, bypass everything
        console.log("[Middleware] ✅ FOUNDER ACCESS GRANTED", {
          email: userEmail ? userEmail.substring(0, 3) + "***" : "none",
          path: pathname,
        });
        return response;
      } else {
        // ❌ NOT A FOUNDER → DENY ACCESS
        console.log("[Middleware] ❌ NON-FOUNDER BLOCKED FROM /admin", {
          email: userEmail ? userEmail.substring(0, 3) + "***" : "none",
        });
        const url = request.nextUrl.clone();
        url.pathname = "/pricing";
        return NextResponse.redirect(url);
      }
    }

    // ============================================================
    // STEP 3: BLOCK OTHER PROTECTED ROUTES IF NOT LOGGED IN
    // ============================================================
    if (!user && pathname.startsWith("/app")) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/signin";
      return NextResponse.redirect(url);
    }

    // ============================================================
    // STEP 4: HANDLE AUTH PAGES FOR LOGGED-IN USERS
    // ============================================================
    if (user && pathname.startsWith("/auth")) {
      const url = request.nextUrl.clone();
      
      // Founders go directly to admin
      if (isUserFounder) {
        console.log("[Middleware] 👤 Founder on /auth → redirecting to /admin");
        url.pathname = "/admin";
        return NextResponse.redirect(url);
      }

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
      
      // If onboarding is not completed, redirect to onboarding
      if (!onboardingCompleted && membership?.organization_id) {
        url.pathname = "/onboarding";
        return NextResponse.redirect(url);
      }
      
      // Otherwise, redirect to app
      url.pathname = "/app";
      return NextResponse.redirect(url);
    }

    // ============================================================
    // STEP 5: ROLE-BASED DASHBOARD GUARD (for /app paths)
    // Founders are already handled above, this is for regular users
    // ============================================================
    if (user && supabase && pathname.startsWith("/app") && !pathname.startsWith("/app/api") && !isFounder) {
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

      if (orgId && !billingAllowed && !isUserFounder) {
        // Founders bypass subscription gating
        const { data: subscription, error: subscriptionError } = await supabase
          .from("org_subscriptions")
          .select("status, current_period_end, trial_expires_at")
          .eq("organization_id", orgId)
          .maybeSingle();

        let subscriptionActive = false;

        if (!subscriptionError && subscription?.status) {
          if (subscription.status === "active") {
            subscriptionActive = true;
          } else if (subscription.status === "trialing") {
            const trialEndValue = subscription.trial_expires_at ?? subscription.current_period_end;
            if (trialEndValue) {
              const trialEnd = new Date(trialEndValue).getTime();
              subscriptionActive = !Number.isNaN(trialEnd) && Date.now() <= trialEnd;
            }
          }
        }

        if (!subscriptionActive) {
          const url = request.nextUrl.clone();
          url.pathname = "/app/billing";
          url.searchParams.set("status", "blocked");
          return NextResponse.redirect(url);
        }
      }
    }

    // -------------------------------
    // 6. SECURITY HEADERS
    // -------------------------------
    // Add security headers to all responses
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co;"
    );

    // -------------------------------
    // 7. ALLOW ONBOARDING ALWAYS
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
