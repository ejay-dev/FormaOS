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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="flex items-center gap-3 p-6">
        <Logo size={36} />
      </div>
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-2xl border border-amber-400/30 bg-amber-500/10 p-8 backdrop-blur-sm">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20">
            <AlertTriangle className="h-6 w-6 text-amber-300" />
          </div>
          <h1 className="mb-3 text-2xl font-bold text-white">
            Link verification failed
          </h1>
          <p className="mb-6 text-sm leading-7 text-slate-200">{message}</p>
          <Link
            href="/auth/signin"
            className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
