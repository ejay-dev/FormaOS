import type { Metadata } from "next";
import { submitMarketingLead } from "./actions";
import ContactPageContentNew from "./ContactPageContentNew";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.formaos.com.au";

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
  twitter: {
    card: 'summary_large_image',
    title: 'Contact FormaOS — Request a Demo',
    description: 'Request a personalized demo or get in touch with the FormaOS team.',
  },
};

export default function ContactPage() {
  return (
    <ContactPageContentNew
      submitAction={submitMarketingLead}
    />
  );
}
