import { VaultUploadButton } from '@/components/vault/vault-upload-button';
import { PageHero, type PageHeroMetric } from '@/components/ui/page-hero';

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
  const metrics: PageHeroMetric[] = [
    { label: 'Artifacts', value: total, sub: 'total' },
    {
      label: 'Pending',
      value: pending,
      sub: pending > 0 ? 'awaiting review' : 'all reviewed',
      tone: pending > 0 ? 'warning' : 'neutral',
    },
    {
      label: 'Verified',
      value: verified,
      sub: verified > 0 ? 'confirmed' : 'none yet',
    },
    { label: 'Storage', value: sizeMB, sub: 'MB' },
  ];

  return (
    <PageHero
      eyebrow="Compliance · Evidence Vault"
      title="Evidence Vault"
      subtitle="Encrypted repository for compliance artifacts."
      metrics={metrics}
      actions={<VaultUploadButton />}
      className="data-tour-vault-header"
    />
  );
}
