import { validateAuditorToken } from '@/lib/auditor/portal';
import { Logo } from '@/components/brand/Logo';
import { brand } from '@/config/brand';
import { AuditPortalNav } from './AuditPortalNav';

export default async function AuditPortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const tokenData = await validateAuditorToken(token);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-6 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo variant="wordmark" size={18} alt={brand.appName} />
            <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              Auditor portal
            </span>
          </div>
          {tokenData && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{tokenData.auditor_name}</span>
              {tokenData.auditor_company && (
                <span>• {tokenData.auditor_company}</span>
              )}
              <span className="text-xs">
                Expires {new Date(tokenData.expires_at).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </header>
      {tokenData && <AuditPortalNav token={token} />}
      <main className="mx-auto max-w-6xl p-6">{children}</main>
    </div>
  );
}
