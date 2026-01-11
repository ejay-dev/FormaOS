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
  if (user) redirect(`${appUrl.replace(/\/$/, "")}/app`);

  return (
    <div className="mk-shell font-[var(--font-body)]">
      <div className="relative min-h-screen overflow-hidden">
        <header className="sticky top-0 z-40 border-b border-white/10 bg-[hsl(var(--background))] glass-panel-elite backdrop-blur-xl">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/40 to-transparent" />
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center gap-3 text-slate-100">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400/80 via-indigo-400/70 to-cyan-300/80 text-sm font-semibold text-[#050711] shadow-[0_0_18px_rgba(56,189,248,0.35)]">
                FO
              </span>
              <div>
                <div className="text-sm font-semibold tracking-tight font-[var(--font-display)]">FormaOS</div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Compliance OS</div>
              </div>
            </Link>
            <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
              <Link href="/" className="hover:text-slate-100 transition-colors">Home</Link>
              <Link href="/product" className="hover:text-slate-100 transition-colors">Product</Link>
              <Link href="/industries" className="hover:text-slate-100 transition-colors">Industries</Link>
              <Link href="/security" className="hover:text-slate-100 transition-colors">Security</Link>
              <Link href="/pricing" className="hover:text-slate-100 transition-colors">Pricing</Link>
              <Link href="/our-story" className="hover:text-slate-100 transition-colors">Our Story</Link>
              <Link href="/contact" className="hover:text-slate-100 transition-colors">Contact</Link>
            </nav>
            <details className="relative md:hidden">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200">
                <Menu className="h-4 w-4" />
                Menu
              </summary>
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-white/10 bg-[hsl(var(--card))] p-2 text-sm text-slate-300 shadow-xl">
                <Link href="/" className="block rounded-lg px-3 py-2 hover:bg-white/10">Home</Link>
                <Link href="/product" className="block rounded-lg px-3 py-2 hover:bg-white/10">Product</Link>
                <Link href="/industries" className="block rounded-lg px-3 py-2 hover:bg-white/10">Industries</Link>
                <Link href="/security" className="block rounded-lg px-3 py-2 hover:bg-white/10">Security</Link>
                <Link href="/pricing" className="block rounded-lg px-3 py-2 hover:bg-white/10">Pricing</Link>
                <Link href="/our-story" className="block rounded-lg px-3 py-2 hover:bg-white/10">Our Story</Link>
                <Link href="/contact" className="block rounded-lg px-3 py-2 hover:bg-white/10">Contact</Link>
                <Link href="/auth/signin" className="block rounded-lg px-3 py-2 hover:bg-white/10">Login</Link>
              </div>
            </details>
            <div className="flex items-center gap-3 text-sm">
              <Link
                href="/auth/signin"
                className="hidden rounded-lg border border-white/10 px-4 py-2 text-slate-300 transition hover:border-white/20 hover:text-slate-100 md:inline-flex"
              >
                Login
              </Link>
              <Link
                href="/pricing"
                className="rounded-lg bg-white/10 px-4 py-2 text-slate-100 transition hover:bg-white/15"
              >
                Plans
              </Link>
              <Link
                href="/auth/signup"
                className="rounded-lg border border-white/10 px-4 py-2 text-slate-100 transition hover:border-white/20 hover:text-slate-100"
              >
                Sign up
              </Link>
              <Link
                href="/contact"
                className="rounded-lg bg-gradient-to-r from-sky-500 via-indigo-500 to-cyan-400 px-4 py-2 text-slate-950 font-semibold shadow-[0_10px_30px_rgba(56,189,248,0.35)]"
              >
                Request Demo
              </Link>
            </div>
          </div>
        </header>

        <main className="relative z-10 mk-stage">
          <OAuthRedirectWrapper />
          {children}
        </main>
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

        <footer className="border-t border-white/10 bg-[hsl(var(--background))] glass-panel-elite">
          <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 px-6 py-12 md:grid-cols-4">
            <div className="space-y-4">
              <div className="text-lg font-semibold font-[var(--font-display)]">FormaOS</div>
              <p className="text-sm text-slate-400">
                Compliance and governance operating system for regulated organizations.
              </p>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Audit ready.</div>
            </div>
            <div className="space-y-3 text-sm text-slate-300">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Platform</div>
              <Link href="/product" className="block hover:text-slate-100">How it works</Link>
              <Link href="/industries" className="block hover:text-slate-100">Industries</Link>
              <Link href="/security" className="block hover:text-slate-100">Security</Link>
              <Link href="/pricing" className="block hover:text-slate-100">Pricing</Link>
            </div>
            <div className="space-y-3 text-sm text-slate-300">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Company</div>
              <Link href="/about" className="block hover:text-slate-100">About</Link>
              <Link href="/our-story" className="block hover:text-slate-100">Our Story</Link>
              <Link href="/contact" className="block hover:text-slate-100">Contact</Link>
              <Link href="/legal/privacy" className="block hover:text-slate-100">Privacy</Link>
              <Link href="/legal/terms" className="block hover:text-slate-100">Terms</Link>
            </div>
            <div className="space-y-3 text-sm text-slate-300">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Access</div>
              <Link href="/auth/signin" className="block hover:text-slate-100">Login</Link>
              <Link href="/pricing" className="block hover:text-slate-100">Plans</Link>
              <Link href="/contact" className="block hover:text-slate-100">Request Demo</Link>
            </div>
          </div>
          <div className="border-t border-white/5 py-6 text-center text-xs text-slate-500">
            FormaOS. Operational compliance for regulated industries.
          </div>
        </footer>
      </div>
    </div>
  );
}
