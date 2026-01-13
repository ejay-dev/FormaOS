import type { Metadata } from "next";
import { submitMarketingLead } from "./actions";
import ContactPageContentNew from "./ContactPageContentNew";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://formaos.com.au";

export const metadata: Metadata = {
  title: "FormaOS | Contact",
  description: "Request a demo or contact the FormaOS team. Get personalized compliance solutions.",
  alternates: {
    canonical: `${siteUrl}/contact`,
  },
  openGraph: {
    title: "FormaOS | Contact",
    description: "Request a demo or contact the FormaOS team. Get personalized compliance solutions.",
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

  return (
    <ContactPageContentNew 
      searchParams={resolvedSearchParams}
      submitAction={submitMarketingLead}
    />
  );
}
