import { VaultUploadButton } from '@/components/vault/vault-upload-button';

interface VaultPageHeroProps {
  total: number;
  pending: number;
  verified: number;
  sizeMB: string;
}

export function VaultPageHero({
  total,
  pending,
  verified,
  sizeMB,
}: VaultPageHeroProps) {
  return (
    <section
      className="relative overflow-hidden rounded-xl border border-border bg-card mb-4"
      data-tour="vault-header"
    >
      <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-primary" />

      <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:p-8">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Compliance · Evidence Vault
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Evidence Vault
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Encrypted repository for compliance artifacts.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
          <HeroMetric value={total} label="Artifacts" sub="total" />
          <HeroMetric
            value={pending}
            label="Pending"
            sub={pending > 0 ? 'awaiting review' : 'all reviewed'}
            tone={pending > 0 ? 'warning' : 'neutral'}
          />
          <HeroMetric
            value={verified}
            label="Verified"
            sub={verified > 0 ? 'confirmed' : 'none yet'}
          />
          <HeroMetric value={sizeMB} label="Storage" sub="MB" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <VaultUploadButton />
        </div>
      </div>
    </section>
  );
}

function HeroMetric({
  value,
  label,
  sub,
  tone = 'neutral',
}: {
  value: string | number;
  label: string;
  sub?: string;
  tone?: 'neutral' | 'warning' | 'danger';
}) {
  const valueClass =
    tone === 'warning'
      ? 'text-amber-500'
      : tone === 'danger'
        ? 'text-rose-500'
        : 'text-foreground';

  return (
    <div className="min-w-0">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-1 text-[28px] font-bold leading-none tabular-nums tracking-tight sm:text-[32px] ${valueClass}`}
      >
        {value}
      </div>
      {sub && (
        <div className="mt-1.5 truncate text-[11px] text-muted-foreground">
          {sub}
        </div>
      )}
    </div>
  );
}
