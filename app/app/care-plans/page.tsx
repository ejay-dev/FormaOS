import { FileText } from 'lucide-react';

export const metadata = {
  title: 'Care Plans | FormaOS',
};

export default function CarePlansPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Care Plans</h1>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Coming Soon</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Manage individualised care plans, goals, and service agreements for
          your residents. This feature is under development and will be
          available soon.
        </p>
      </div>
    </div>
  );
}
