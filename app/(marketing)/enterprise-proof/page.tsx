import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  ClipboardCheck,
  LifeBuoy,
  Lock,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';
import { MarketingPageShell } from '@/app/(marketing)/components/shared/MarketingPageShell';
import { CompactHero } from '@/components/motion/CompactHero';
import { CompactHeroIcon } from '@/components/motion/CompactHeroIcon';
import { siteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'FormaOS | Enterprise Operations Proof',
  description:
    'A buyer-facing proof page showing how FormaOS handles admin governance, customer rescue, auditability, and enterprise support operations.',
  alternates: { canonical: `${siteUrl}/enterprise-proof` },
  openGraph: {
    title: 'FormaOS | Enterprise Operations Proof',
    description:
      'Buyer-facing proof of governance, auditability, customer rescue, and enterprise support operations in FormaOS.',
    type: 'website',
    url: `${siteUrl}/enterprise-proof`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FormaOS | Enterprise Operations Proof',
    description:
      'Buyer-facing proof of governance, auditability, customer rescue, and enterprise support operations in FormaOS.',
  },
};

const proofAreas = [
  {
    icon: ShieldCheck,
    title: 'Governed Admin Access',
    items: [
      'Founder plus delegated platform-admin model',
      'Approval-gated high-risk delegated changes',
      'Written reasons on privileged mutations',
    ],
  },
  {
    icon: ClipboardCheck,
    title: 'Provable Audit Trail',
    items: [
      'Unified admin audit read surface',
      'Operator actions tracked against user, action, target, and reason',
      'Support, release, billing, and control-plane actions included',
    ],
  },
  {
    icon: LifeBuoy,
    title: 'Customer Rescue Operations',
    items: [
      'Customer-360 org workspace for support and rescue',
      'Activation and billing-risk signals inside admin org view',
      'Member management and entitlement overrides',
    ],
  },
  {
    icon: Lock,
    title: 'Lifecycle Controls',
    items: [
      'Org lock/unlock for access control incidents',
      'Org suspend/restore lifecycle for operational intervention',
      'Session revoke and security alert workflows',
    ],
  },
  {
    icon: SlidersHorizontal,
    title: 'Operator Control Plane',
    items: [
      'Feature flags, system settings, and operational jobs',
      'Release workflows with additional control on high-risk changes',
      'Security, sessions, and activity promoted to first-class admin surfaces',
    ],
  },
  {
    icon: BadgeCheck,
    title: 'Procurement Readiness',
    items: [
      'Trust packet, procurement FAQ, and security review walkthrough',
      'Enterprise proof surfaces aligned to implemented controls',
      'Buyer-facing artifacts focused on validation over hand-waving',
    ],
  },
];

export default function EnterpriseProofPage() {
  return (
    <MarketingPageShell>
      <CompactHero
        title="Enterprise Operations Proof"
        description="A clear view of how FormaOS governs admin power, supports enterprise customers, and creates buyer-visible operational proof."
        topColor="emerald"
        bottomColor="cyan"
        visualContent={
          <CompactHeroIcon
            icon={<ShieldCheck className="h-8 w-8 text-emerald-400" />}
            color="52,211,153"
          />
        }
      />

      <div className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {proofAreas.map((area) => {
            const Icon = area.icon;
            return (
              <div
                key={area.title}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <div className="mb-4 flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold text-foreground">
                    {area.title}
                  </h2>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {area.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-card p-8">
          <h2 className="text-xl font-semibold text-foreground">
            Fast Buyer Validation Path
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Link
              href="/trust/procurement"
              className="rounded-xl border border-border bg-background px-5 py-4 text-sm text-foreground hover:bg-muted/30"
            >
              Procurement FAQ <ArrowRight className="ml-2 inline h-4 w-4" />
            </Link>
            <Link
              href="/trust/packet"
              className="rounded-xl border border-border bg-background px-5 py-4 text-sm text-foreground hover:bg-muted/30"
            >
              Vendor Trust Packet <ArrowRight className="ml-2 inline h-4 w-4" />
            </Link>
            <Link
              href="/security-review"
              className="rounded-xl border border-border bg-background px-5 py-4 text-sm text-foreground hover:bg-muted/30"
            >
              Security Review Walkthrough{' '}
              <ArrowRight className="ml-2 inline h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="rounded-xl border border-border bg-background px-5 py-4 text-sm text-foreground hover:bg-muted/30"
            >
              Request Enterprise Review{' '}
              <ArrowRight className="ml-2 inline h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </MarketingPageShell>
  );
}
