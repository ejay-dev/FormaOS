import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Layers,
  ShieldCheck,
  Target,
} from 'lucide-react';
import { brand } from '@/config/brand';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://formaos.com.au';
const appBase = brand.seo.appUrl.replace(/\/$/, '');

export const metadata: Metadata = {
  title: 'FormaOS | Framework Coverage',
  description:
    'Framework-mapped controls and evidence workflows. Build repeatable compliance execution, not static checklists.',
  alternates: {
    canonical: `${siteUrl}/frameworks`,
  },
  openGraph: {
    title: 'FormaOS | Framework Coverage',
    description:
      'Framework-mapped controls and evidence workflows. Build repeatable compliance execution, not static checklists.',
    type: 'website',
    url: `${siteUrl}/frameworks`,
  },
};

const frameworkPacks = [
  {
    name: 'ISO 27001',
    notes: 'Control packs aligned for security management systems.',
  },
  { name: 'SOC 2', notes: 'Trust Services Criteria mapped into executable work.' },
  { name: 'GDPR', notes: 'Privacy obligations mapped to controls and evidence.' },
  { name: 'HIPAA', notes: 'Healthcare safeguards mapped for defensible operations.' },
  { name: 'PCI DSS', notes: 'Payment security requirements mapped to control tasks.' },
  { name: 'NIST', notes: 'Risk and control model alignment for security programs.' },
  { name: 'CIS', notes: 'Baseline hardening and operational control coverage.' },
] as const;

const principles = [
  {
    icon: Layers,
    title: 'Frameworks become work',
    detail:
      'Controls map into tasks, owners, deadlines, and evidence requirements. Your compliance program executes continuously.',
  },
  {
    icon: Target,
    title: 'Evidence stays contextual',
    detail:
      'Evidence is linked to the control and the workflow that produced it, with verification status and audit history.',
  },
  {
    icon: ShieldCheck,
    title: 'Audit-ready exports',
    detail:
      'Generate defensible bundles and posture snapshots without rebuilding spreadsheets every quarter.',
  },
] as const;

export default function FrameworksPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0f1c] text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),_transparent_45%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(139,92,246,0.10),_transparent_44%)]" />

      <section className="relative mx-auto max-w-7xl px-4 pb-12 pt-28 sm:px-6 lg:px-8 lg:pb-18 lg:pt-36">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-cyan-100">
          <Layers className="h-4 w-4" />
          Framework Coverage
        </div>
        <h1 className="mt-6 text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
          Framework-mapped controls, built for execution
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-relaxed text-slate-300 sm:text-lg">
          FormaOS ships framework packs that map obligations into controls and
          evidence workflows. This is alignment and operational mapping, not a
          certification claim.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href={`${appBase}/auth/signup?source=frameworks`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white"
          >
            Start Free Trial
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/security-review"
            className="inline-flex items-center justify-center rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            Security Review Packet
          </Link>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-3">
          {principles.map((p) => (
            <article
              key={p.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <div className="mb-4 inline-flex rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-2">
                <p.icon className="h-5 w-5 text-cyan-200" />
              </div>
              <h2 className="text-lg font-semibold text-white">{p.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                {p.detail}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/7 via-white/4 to-transparent p-7 lg:p-10">
          <div className="flex items-end justify-between gap-6">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                Included Framework Packs
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                Packs represent mapped control structures and workflow defaults.
                Actual applicability varies by organization and scope.
              </p>
            </div>
            <Link
              href="/trust"
              className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Trust Center
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {frameworkPacks.map((f) => (
              <div
                key={f.name}
                className="rounded-xl border border-white/10 bg-white/5 p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 inline-flex rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-200" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {f.name}
                    </div>
                    <div className="mt-1 text-xs leading-relaxed text-slate-300">
                      {f.notes}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-6 text-xs text-slate-500">
            FormaOS can help accelerate audits by making control execution and
            evidence defensible. It does not imply certification status.
          </p>
        </div>
      </section>
    </div>
  );
}

