import type { Metadata } from "next";
import { submitMarketingLead } from "./actions";
import { MarketingAnchor } from "../components/marketing-anchor";
import { ContactHero, ContactContent } from "./ContactPageContent";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://formaos.com.au";

export const metadata: Metadata = {
  title: "FormaOS | Contact",
  description: "Request a demo or contact the FormaOS team.",
  alternates: {
    canonical: `${siteUrl}/contact`,
  },
  openGraph: {
    title: "FormaOS | Contact",
    description: "Request a demo or contact the FormaOS team.",
    type: "website",
    url: `${siteUrl}/contact`,
  },
};

type ContactPageProps = {
  searchParams?: Promise<{
    success?: string;
    error?: string;
  }>;
};

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const resolvedSearchParams = await searchParams;
  const status = resolvedSearchParams?.success ? "success" : resolvedSearchParams?.error ? "error" : null;

  return (
    <div>
      <ContactHero status={status} />
      <ContactContent action={submitMarketingLead} />
    </div>
  );
}
