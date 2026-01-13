import type { Metadata } from "next";
import { MarketingAnchor } from "../components/marketing-anchor";
import { PricingHero, PricingContent } from "./PricingPageContent";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://formaos.com.au";

export const metadata: Metadata = {
  title: "FormaOS | Pricing",
  description: "Pricing tiers for FormaOS: Starter, Pro, and Enterprise compliance operations.",
  alternates: {
    canonical: `${siteUrl}/pricing`,
  },
  openGraph: {
    title: "FormaOS | Pricing",
    description: "Transparent plans for compliance-focused teams and regulated operators.",
    type: "website",
    url: `${siteUrl}/pricing`,
  },
};

export default function PricingPage() {
  return (
    <div>
      <PricingHero />
      <PricingContent />
      <MarketingAnchor 
        title="Start your compliance transformation"
        subtitle="14-day free trial · No credit card required"
        badge="Get Started"
      />
    </div>
  );
}
