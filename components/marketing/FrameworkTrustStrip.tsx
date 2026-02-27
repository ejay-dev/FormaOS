'use client';

import { memo, type ReactNode } from 'react';
import {
  Shield,
  ShieldCheck,
  FileCheck,
  Heart,
  CreditCard,
  Globe,
  Scale,
  Users,
  ShieldAlert,
  AlertTriangle,
  Lock,
  FileSearch,
  Eye,
  MonitorCheck,
  HardDrive,
  Wifi,
} from 'lucide-react';
import LogoLoop from './LogoLoop';

interface FrameworkItem {
  icon: ReactNode;
  label: string;
}

const FRAMEWORK_ITEMS: FrameworkItem[] = [
  { icon: <Shield size={16} />, label: 'ISO 27001' },
  { icon: <ShieldCheck size={16} />, label: 'SOC 2 Type II' },
  { icon: <FileCheck size={16} />, label: 'NDIS Practice Standards' },
  { icon: <Heart size={16} />, label: 'HIPAA' },
  { icon: <CreditCard size={16} />, label: 'PCI DSS 4.0' },
  { icon: <Globe size={16} />, label: 'GDPR' },
  { icon: <Scale size={16} />, label: 'Australian Privacy Act' },
  { icon: <Users size={16} />, label: 'Aged Care Quality Standards' },
  { icon: <ShieldAlert size={16} />, label: 'Child Safe Standards' },
  { icon: <AlertTriangle size={16} />, label: 'Incident Management' },
  { icon: <Lock size={16} />, label: 'Role-Based Access' },
  { icon: <FileSearch size={16} />, label: 'Immutable Audit Trail' },
  { icon: <Eye size={16} />, label: 'Evidence Integrity' },
  { icon: <MonitorCheck size={16} />, label: 'Continuous Monitoring' },
  { icon: <HardDrive size={16} />, label: 'Encryption at Rest' },
  { icon: <Wifi size={16} />, label: 'Encryption in Transit' },
];

const FrameworkBadge = memo(function FrameworkBadge({ icon, label }: FrameworkItem) {
  return (
    <span className="home-panel home-panel--soft framework-badge group inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 backdrop-blur-sm transition-all duration-300 hover:border-cyan-400/20 hover:bg-white/[0.07] hover:shadow-[0_0_20px_rgba(6,182,212,0.08)] hover:-translate-y-px">
      <span className="flex-shrink-0 text-cyan-400/70 transition-colors duration-300 group-hover:text-cyan-400/90">
        {icon}
      </span>
      <span className="whitespace-nowrap text-[13px] font-medium leading-none tracking-wide text-slate-300/80 transition-colors duration-300 group-hover:text-slate-200">
        {label}
      </span>
    </span>
  );
});

const frameworkLogos = FRAMEWORK_ITEMS.map((item) => ({
  node: <FrameworkBadge icon={item.icon} label={item.label} />,
  title: item.label,
  ariaLabel: item.label,
}));

export const FrameworkTrustStrip = memo(function FrameworkTrustStrip({
  className = '',
}: {
  className?: string;
}) {
  return (
    <section
      className={`framework-trust-strip home-section home-section--contrast relative z-10 ${className}`}
      style={{ height: 80 }}
      aria-label="Supported compliance frameworks"
    >
      <div className="absolute inset-0 flex items-center">
        <LogoLoop
          logos={frameworkLogos}
          speed={40}
          direction="left"
          logoHeight={44}
          gap={16}
          hoverSpeed={15}
          fadeOut
          fadeOutColor="#0a0f1c"
          ariaLabel="Supported compliance frameworks"
        />
      </div>
    </section>
  );
});

export default FrameworkTrustStrip;
