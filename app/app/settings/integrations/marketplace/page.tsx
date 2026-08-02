import { redirect } from 'next/navigation';

// The integrations page is the catalog; this route duplicated it and every
// card's only action was linking back here.
export default function IntegrationMarketplaceRedirectPage() {
  redirect('/app/settings/integrations');
}
