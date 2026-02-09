import { ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Certificates | FormaOS',
};

export default function CertificatesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Certificates</h1>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
        <ShieldCheck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Coming Soon</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Track staff certifications, training records, and compliance
          certificates. This feature is under development and will be available
          soon.
        </p>
      </div>
    </div>
  );
}
