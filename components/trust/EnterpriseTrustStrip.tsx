import Link from 'next/link';
import { ShieldCheck, CheckCircle2, Lock, Activity } from 'lucide-react';
import { brand } from '@/config/brand';
import clsx from 'clsx';

type TrustSurface = 'marketing' | 'auth' | 'onboarding' | 'app' | 'admin';

const SURFACE_LABELS: Record<TrustSurface, string> = {
  marketing: 'Enterprise trust posture',
  auth: 'Secure sign-in posture',
  onboarding: 'Guided activation posture',
  app: 'Live compliance posture',
  admin: 'Platform operations posture',
};

const ARTIFACTS = [
  'ISO/SOC framework mapped',
  'Immutable evidence chains',
  'Role-based access controls',
  'Continuous posture monitoring',
];

export function EnterpriseTrustStrip({
  surface,
  className,
}: {
  surface: TrustSurface;
  className?: string;
}) {
  return (
    <section
      className={clsx(
        'border-y border-cyan-200 bg-cyan-50 backdrop-blur-sm dark:border-cyan-400/20 dark:bg-cyan-500/8',
        className,
      )}
      aria-label="Enterprise trust signals"
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-900 dark:text-cyan-100">
          <ShieldCheck className="h-4 w-4" />
          {SURFACE_LABELS[surface]}
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {ARTIFACTS.map((artifact) => (
            <span
              key={artifact}
              className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300 bg-cyan-100 px-2.5 py-1 text-[11px] text-cyan-900 dark:border-cyan-300/25 dark:bg-cyan-500/10 dark:text-cyan-50"
            >
              <CheckCircle2 className="h-3 w-3" />
              {artifact}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3 text-[11px] text-cyan-900/90 dark:text-cyan-50/90">
          <span className="inline-flex items-center gap-1.5">
            <Activity className="h-3 w-3" />
            Monitored
          </span>
          <Link
            href={`mailto:security@${brand.domain}`}
            className="inline-flex items-center gap-1.5 underline decoration-cyan-500/60 underline-offset-2 hover:text-cyan-950 dark:decoration-cyan-200/50 dark:hover:text-white"
          >
            <Lock className="h-3 w-3" />
            security@{brand.domain}
          </Link>
        </div>
      </div>
    </section>
  );
}
