import { validateAuditorToken } from '@/lib/auditor/portal';
import { redirect } from 'next/navigation';

export default async function AuditPortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const tokenData = await validateAuditorToken(token);
  if (!tokenData) redirect('/');

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-6 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-foreground">FormaOS</span>
            <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-400">
              Auditor Portal
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{tokenData.auditor_name}</span>
            {tokenData.auditor_company && (
              <span>• {tokenData.auditor_company}</span>
            )}
            <span className="text-xs">
              Expires {new Date(tokenData.expires_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </header>
      <nav className="border-b border-border bg-card/50">
        <div className="mx-auto flex max-w-6xl gap-1 px-6">
          {[
            { label: 'Overview', href: `/audit-portal/${token}` },
            { label: 'Evidence', href: `/audit-portal/${token}/evidence` },
            { label: 'Controls', href: `/audit-portal/${token}/controls` },
            { label: 'Reports', href: `/audit-portal/${token}/reports` },
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="border-b-2 border-transparent px-4 py-2.5 text-sm text-muted-foreground hover:border-primary hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </div>
      </nav>
      <main className="mx-auto max-w-6xl p-6">{children}</main>
    </div>
  );
}
