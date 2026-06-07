import Link from 'next/link';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';

type ConfirmErrorPageProps = {
  searchParams: Promise<{
    message?: string;
  }>;
};

const DEFAULT_MESSAGE =
  'We could not verify this link. Please request a new confirmation email and try again.';

export default async function ConfirmErrorPage({
  searchParams,
}: ConfirmErrorPageProps) {
  const resolved = await searchParams;
  const message = resolved?.message?.trim() || DEFAULT_MESSAGE;

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center gap-3 p-6">
        <Logo variant="wordmark" size={28} className="text-foreground" />
      </div>
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-2xl border border-warning/20 bg-warning/10 p-8">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-warning/10 border border-warning/20">
            <AlertTriangle className="h-6 w-6 text-warning" />
          </div>
          <h1 className="mb-3 text-2xl font-bold text-foreground">
            Link verification failed
          </h1>
          <p className="mb-6 text-sm leading-7 text-foreground">{message}</p>
          <Link
            href="/auth/signin"
            className="inline-flex items-center gap-2 rounded-lg bg-surface-2 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-surface-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
