import { IntegrationCard } from './integration-card';

export type IntegrationCatalogItem = {
  id: 'slack' | 'teams' | 'jira' | 'linear' | 'google_drive' | 'webhook_relay';
  name: string;
  description: string;
  status: 'available' | 'beta';
  capabilities: string[];
  connected?: boolean;
  health?: string;
  lastSyncAt?: string | null;
  config?: Record<string, unknown> | null;
  connectedId?: string | null;
};

export function IntegrationCatalog({ items }: { items: IntegrationCatalogItem[] }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {items.map((item) => (
        <IntegrationCard key={item.id} {...item} />
      ))}
    </div>
  );
}
