import { redirect } from 'next/navigation';
import { AdminShell } from '@/app/admin/components/admin-shell';
import { requireFounderAccess } from '@/app/app/admin/access';
import { ComplianceSystemProvider } from '@/components/compliance-system/provider';
import { CommandPalette } from '@/components/command-palette/CommandPalette';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let userEmail: string | undefined;

  try {
    const result = await requireFounderAccess();
    userEmail = result.user.email ?? undefined;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[admin/layout] Access denied:', errorMessage);

    if (errorMessage === 'Forbidden') {
      redirect('/app');
    }
    redirect('/auth/signin');
  }

  return (
    <ComplianceSystemProvider>
      <AdminShell email={userEmail}>
        {children}
        <CommandPalette />
      </AdminShell>
    </ComplianceSystemProvider>
  );
}
