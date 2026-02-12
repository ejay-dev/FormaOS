import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  FileLock2,
  Fingerprint,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { brand } from '@/config/brand';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://formaos.com.au';
const appBase = brand.seo.appUrl.replace(/\/$/, '');

export const metadata: Metadata = {
  title: 'FormaOS | Security Review Packet',
  description:
    'Procurement-ready security review walkthrough: architecture, data handling, access controls, audit logging, and operational assurance.',
  alternates: {
    canonical: `${siteUrl}/security-review`,
  },
  openGraph: {
    title: 'FormaOS | Security Review Packet',
    description:
      'Procurement-ready security review walkthrough: architecture, data handling, access controls, audit logging, and operational assurance.',
    type: 'website',
    url: `${siteUrl}/security-review`,
  },
};

const sections = [
  {
    icon: ShieldCheck,
    title: 'Security architecture overview',
    points: [
      'Tenant isolation and organization boundaries',
      'Application-layer authorization and role model',
      'Operational controls and change management',
    ],
  },
  {
    icon: Fingerprint,
    title: 'Identity, auth, and session security',
    points: [
      'Email, OAuth, and optional MFA strategies',
      'Session handling and secure cookie posture',
      'Least-privilege access patterns by role',
    ],
  },
  {
    icon: Lock,
    title: 'Data handling and encryption',
    points: [
      'Encryption-in-transit and secure storage primitives',
      'Evidence handling patterns and chain-of-custody metadata',
      'Retention expectations and deletion workflows',
    ],
  },
  {
    icon: FileLock2,
    title: 'Audit logging and evidence defensibility',
    points: [
      'Immutable audit history for critical actions',
      'Evidence verification workflow and segregation controls',
      'Exportable audit bundles for review and regulators',
    ],
  },
  {
    icon: ClipboardCheck,
    title: 'Operational assurance',
    points: [
      'Monitoring posture and incident response readiness',
      'Change visibility and release discipline',
      'Buyer-facing trust artifacts and access control expectations',
    ],
  },
] as const;

const checklist = [
  'Data flow diagram (high level)',
  'Tenant isolation model (org boundary + RLS posture)',
  'Authentication methods and session handling',
  'Evidence storage approach and access controls',
  'Audit logging coverage and export capabilities',
  'Incident response and operational contacts',
] as const;

export default function SecurityReviewPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0f1c] text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),_transparent_45%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(59,130,246,0.12),_transparent_42%)]" />
      <div className="absolute inset-0 opacity-[0.02]" />

      <section className="relative mx-auto max-w-7xl px-4 pb-14 pt-28 sm:px-6 lg:px-8 lg:pb-18 lg:pt-36">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-cyan-100">
          <ShieldCheck className="h-4 w-4" />
          Procurement Ready
        </div>
        <h1 className="mt-6 text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
          Security Review Packet for Enterprise Buyers
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-relaxed text-slate-300 sm:text-lg">
          Security review should not stall your deal cycle. FormaOS is designed
          to be reviewable: clear architecture, controlled evidence handling,
          and audit-ready operational assurance.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white"
          >
            Request Security Review Walkthrough
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={`${appBase}/auth/signup?source=security_review`}
            className="inline-flex items-center justify-center rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            Start Trial (Trust-Ready)
          </Link>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sections.map((s) => (
            <article
              key={s.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <div className="mb-4 inline-flex rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-2">
                <s.icon className="h-5 w-5 text-cyan-200" />
              </div>
              <h2 className="text-lg font-semibold text-white">{s.title}</h2>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-300">
                {s.points.map((p) => (
                  <li key={p} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/7 via-white/4 to-transparent p-7 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                Security Review Checklist
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
                The items below match typical procurement questionnaires. If
                your organization needs additional detail (DPA, vendor risk
                artifacts, or proof-of-control screenshots), we can support that
                during the walkthrough.
              </p>
            </div>
            <Link
              href="/trust"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Visit Trust Center
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {checklist.map((item) => (
              <div
                key={item}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"
              >
                {item}
              </div>
            ))}
          </div>

          <p className="mt-6 text-xs text-slate-500">
            Note: Content here describes the FormaOS review experience. Do not
            treat it as a formal certification claim.
          </p>
        </div>
      </section>
    </div>
  );
}

