import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText, Shield, Scale, ArrowRight, Lock } from 'lucide-react';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://formaos.com.au';

export const metadata: Metadata = {
  title: 'FormaOS | Legal',
  description:
    'Legal and compliance resources for FormaOS: Terms, Privacy, DPA summary, subprocessors, and status.',
  alternates: { canonical: `${siteUrl}/legal` },
};

const links = [
  {
    title: 'Terms of Service',
    href: '/legal/terms',
    description: 'Commercial terms and platform usage conditions.',
    icon: Scale,
  },
  {
    title: 'Privacy Policy',
    href: '/legal/privacy',
    description: 'How we handle personal information and privacy requests.',
    icon: Lock,
  },
  {
    title: 'Data Processing Agreement (Summary)',
    href: '/trust/dpa',
    description: 'DPA summary for enterprise procurement and legal review.',
    icon: FileText,
  },
  {
    title: 'Subprocessors',
    href: '/trust/subprocessors',
    description: 'Current subprocessor list and data-handling roles.',
    icon: Shield,
  },
  {
    title: 'Status',
    href: '/status',
    description: 'Public uptime checks and current system status.',
    icon: Shield,
  },
] as const;

export default function LegalIndexPage() {
  return (
    <main className="bg-background min-h-screen">
      <div className="mx-auto max-w-5xl px-6 py-24">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Scale className="h-8 w-8 text-primary" aria-hidden="true" />
            <h1 className="text-3xl font-bold text-foreground">Legal</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Procurement-ready legal and privacy resources. Content reflects
            implemented platform behavior and contract-first commitments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="group rounded-2xl border border-border bg-card p-6 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="rounded-xl border border-border bg-muted/30 p-2">
                  <l.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-base font-semibold text-foreground">
                      {l.title}
                    </h2>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {l.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <p className="mt-10 text-xs text-muted-foreground">
          Note: This page is informational and does not replace your executed
          agreement. For enterprise procurement, request the Trust Packet PDF
          and a guided walkthrough.
        </p>
      </div>
    </main>
  );
}

