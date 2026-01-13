import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Menu } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { OAuthRedirectWrapper } from "./components/oauth-redirect-wrapper";
import "./marketing.css";

export default async function MarketingLayout({ children }: { children: ReactNode }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://formaos.com.au";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? siteUrl;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (user) {
    // Check if user is a founder
    const parseEnvList = (value?: string | null) =>
      new Set(
        (value ?? "")
          .split(",")
          .map((entry) => entry.trim().toLowerCase())
          .filter(Boolean)
      );
    
    const founderEmails = parseEnvList(process.env.FOUNDER_EMAILS);
    const founderIds = parseEnvList(process.env.FOUNDER_USER_IDS);
    const userEmail = (user?.email ?? "").trim().toLowerCase();
    const userId = (user?.id ?? "").trim().toLowerCase();
    const isFounder = Boolean(
      user && ((userEmail && founderEmails.has(userEmail)) || founderIds.has(userId))
    );
    
    // 🔍 DEBUG LOGGING
    console.log("[marketing/layout] Authenticated user redirect", {
      email: userEmail,
      isFounder,
      destination: isFounder ? "/admin" : "/app",
    });
    
    // Founders go to admin, regular users go to app
    const destination = isFounder ? "/admin" : "/app";
    redirect(`${appUrl.replace(/\/$/, "")}${destination}`);
  }

  return (
    <div className="mk-shell font-[var(--font-body)]">
      <div className="relative min-h-screen overflow-hidden">
        {/* Premium header */}
        <header className="sticky top-0 z-50 glass-panel-strong border-b border-white/8">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 lg:px-8 py-5">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary text-sm font-bold text-primary-foreground shadow-premium-lg glow-cyan transition-all group-hover:scale-105">
                FO
              </div>
              <div>
                <div className="text-base font-bold tracking-tight font-display">FormaOS</div>
                <div className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground font-medium">Compliance OS</div>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden items-center gap-8 text-[15px] text-foreground/80 md:flex font-medium">
              <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
              <Link href="/product" className="hover:text-foreground transition-colors">Product</Link>
              <Link href="/industries" className="hover:text-foreground transition-colors">Industries</Link>
              <Link href="/security" className="hover:text-foreground transition-colors">Security</Link>
              <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
              <Link href="/our-story" className="hover:text-foreground transition-colors">Our Story</Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
            </nav>

            {/* Mobile menu (overlay to avoid hero overlap) */}
            <details className="relative md:hidden">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg glass-panel px-3 py-2 text-sm text-foreground font-medium">
                <Menu className="h-4 w-4" />
                Menu
              </summary>
              {/* Full-screen overlay with isolated z-index */}
              <div className="fixed inset-0 z-[60]">
                {/* Backdrop */}
                <div className="absolute inset-0 bg-black/60" />
                {/* Panel */}
                <div className="absolute right-4 top-20 w-[calc(100%-2rem)] max-w-sm rounded-2xl glass-panel-strong p-2 text-sm shadow-premium-xl border border-white/10">
                  <Link href="/" className="block rounded-lg px-4 py-2.5 hover:bg-white/10 transition-colors">Home</Link>
                  <Link href="/product" className="block rounded-lg px-4 py-2.5 hover:bg-white/10 transition-colors">Product</Link>
                  <Link href="/industries" className="block rounded-lg px-4 py-2.5 hover:bg-white/10 transition-colors">Industries</Link>
                  <Link href="/security" className="block rounded-lg px-4 py-2.5 hover:bg-white/10 transition-colors">Security</Link>
                  <Link href="/pricing" className="block rounded-lg px-4 py-2.5 hover:bg-white/10 transition-colors">Pricing</Link>
                  <Link href="/our-story" className="block rounded-lg px-4 py-2.5 hover:bg-white/10 transition-colors">Our Story</Link>
                  <Link href="/contact" className="block rounded-lg px-4 py-2.5 hover:bg-white/10 transition-colors">Contact</Link>
                  <div className="my-2 h-px bg-white/10" />
                  <Link href="/auth/signin" className="block rounded-lg px-4 py-2.5 hover:bg-white/10 transition-colors">Login</Link>
                </div>
              </div>
            </details>

            {/* CTA buttons */}
            <div className="hidden md:flex items-center gap-3 text-[15px]">
              <Link href="/auth/signin" className="btn btn-secondary">
                Login
              </Link>
              <Link href="/pricing" className="btn btn-ghost">
                Plans
              </Link>
              <Link href="/auth/signup" className="btn btn-primary">
                Sign up
              </Link>
            </div>
          </div>
        </header>

        <main className="relative z-10">{children}</main>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "FormaOS",
                url: siteUrl,
                contactPoint: [
                  {
                    "@type": "ContactPoint",
                    contactType: "sales",
                    email: "sales@formaos.com",
                  },
                ],
              },
              {
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                name: "FormaOS",
                applicationCategory: "BusinessApplication",
                operatingSystem: "Web",
                url: siteUrl,
                description:
                  "Compliance and governance operating system for regulated industries.",
              },
            ]),
          }}
        />

        <footer className="border-t border-white/8 glass-panel backdrop-blur-xl">
          <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-12 px-6 lg:px-8 py-16 md:grid-cols-4">
            <div className="space-y-5">
              <div className="text-xl font-bold font-display">FormaOS</div>
              <p className="text-[15px] text-muted-foreground leading-relaxed">
                Compliance and governance operating system for regulated organizations.
              </p>
              <div className="text-xs uppercase tracking-[0.3em] text-primary font-semibold">Audit Ready</div>
            </div>

            <div className="space-y-4 text-[15px]">
              <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground font-semibold">Platform</div>
              <div className="space-y-3">
                <Link href="/product" className="block text-foreground/70 hover:text-foreground transition-colors">How it works</Link>
                <Link href="/industries" className="block text-foreground/70 hover:text-foreground transition-colors">Industries</Link>
                <Link href="/security" className="block text-foreground/70 hover:text-foreground transition-colors">Security</Link>
                <Link href="/pricing" className="block text-foreground/70 hover:text-foreground transition-colors">Pricing</Link>
              </div>
            </div>

            <div className="space-y-4 text-[15px]">
              <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground font-semibold">Company</div>
              <div className="space-y-3">
                <Link href="/about" className="block text-foreground/70 hover:text-foreground transition-colors">About</Link>
                <Link href="/our-story" className="block text-foreground/70 hover:text-foreground transition-colors">Our Story</Link>
                <Link href="/contact" className="block text-foreground/70 hover:text-foreground transition-colors">Contact</Link>
                <Link href="/legal/privacy" className="block text-foreground/70 hover:text-foreground transition-colors">Privacy</Link>
                <Link href="/legal/terms" className="block text-foreground/70 hover:text-foreground transition-colors">Terms</Link>
              </div>
            </div>

            <div className="space-y-4 text-[15px]">
              <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground font-semibold">Access</div>
              <div className="space-y-3">
                <Link href="/auth/signin" className="block text-foreground/70 hover:text-foreground transition-colors">Login</Link>
                <Link href="/pricing" className="block text-foreground/70 hover:text-foreground transition-colors">Plans</Link>
                <Link href="/contact" className="block text-foreground/70 hover:text-foreground transition-colors">Request Demo</Link>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 py-8 text-center text-sm text-muted-foreground">
            <p>© 2026 FormaOS. Operational compliance for regulated industries.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
