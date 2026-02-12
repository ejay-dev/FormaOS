import { EnterpriseTrustStrip } from '@/components/trust/EnterpriseTrustStrip';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950">
      <EnterpriseTrustStrip surface="auth" />
      {children}
    </div>
  );
}
